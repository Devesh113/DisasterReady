const { prisma } = require('../config/db');
const notificationService = require('./notification.service');
const {
  isValidCoordinates,
  isValidRadius,
  getBoundingBox,
  isWithinRadius,
} = require('../utils/geo');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Common Prisma include configuration for Alert queries.
 * Selects associated Disaster and Issuing Authority information safely,
 * without exposing sensitive user credentials.
 */
const ALERT_INCLUDE = {
  disaster: {
    select: {
      id: true,
      name: true,
      type: true,
      guidelines: true,
    },
  },
  issuedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
};

/**
 * Service managing Emergency Alerts CRUD, status updates,
 * and geospatial proximity filtering.
 */
class AlertService {
  /**
   * Create a new emergency alert.
   * Derives issuing authority strictly from the authenticated user.
   *
   * @param {Object} data - Validated alert input
   * @param {Object} user - Authenticated user context ({ id, role })
   * @returns {Promise<Object>} Created alert record
   */
  async createAlert(data, user) {
    // 1. Verify referenced disaster exists
    const disaster = await prisma.disaster.findUnique({
      where: { id: data.disasterId },
    });

    if (!disaster) {
      const error = new Error(`Referenced disaster with ID '${data.disasterId}' does not exist.`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // 2. Insert alert with strict field whitelisting
    const alert = await prisma.alert.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status || 'ACTIVE',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        radius: data.radius ?? null,
        expiresAt: data.expiresAt ?? null,
        disaster: { connect: { id: data.disasterId } },
        issuedBy: { connect: { id: user.id } },
      },
      include: ALERT_INCLUDE,
    });

    // Dispatch in-app notifications if the alert is ACTIVE
    if (alert.status === 'ACTIVE') {
      await notificationService.handleAlertCreatedOrUpdated({
        alert,
        actionType: 'CREATED',
      });
    }

    return alert;
  }

  /**
   * Retrieve alerts with pagination, multi-criteria filtering, and geospatial proximity.
   *
   * Note on Geospatial Proximity:
   * When latitude, longitude, and radius are provided, the query calculates alert-centre
   * proximity: distance(query_center, alert_center) <= search_radius.
   * It uses a database bounding-box candidate query first to prevent loading the entire
   * table into memory, followed by precise Haversine distance verification.
   *
   * @param {Object} queryParams
   * @returns {Promise<{ data: Object[], pagination: Object }>}
   */
  async getAllAlerts({
    page = 1,
    limit = 10,
    severity,
    status,
    disasterId,
    disasterType,
    search,
    latitude,
    longitude,
    radius,
    radiusKm,
  }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const where = {};

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (disasterId) {
      where.disasterId = disasterId;
    }

    if (disasterType) {
      where.disaster = { type: disasterType };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const effectiveRadius = radius !== undefined ? radius : radiusKm;
    const hasGeo =
      latitude !== undefined &&
      longitude !== undefined &&
      effectiveRadius !== undefined &&
      isValidCoordinates(latitude, longitude) &&
      isValidRadius(effectiveRadius);

    if (hasGeo) {
      // 1. Calculate database pre-filter bounding box to restrict scanned rows
      const bbox = getBoundingBox(latitude, longitude, effectiveRadius);
      where.latitude = { gte: bbox.minLat, lte: bbox.maxLat };
      where.longitude = { gte: bbox.minLon, lte: bbox.maxLon };

      // 2. Fetch candidate alerts bounded by the candidate box
      const candidates = await prisma.alert.findMany({
        where,
        include: ALERT_INCLUDE,
        orderBy: { issuedAt: 'desc' },
      });

      // 3. Filter using exact Great-Circle Haversine distance (alert-centre proximity)
      const filtered = candidates.filter((alert) => {
        if (alert.latitude === null || alert.longitude === null) return false;
        return isWithinRadius(latitude, longitude, alert.latitude, alert.longitude, effectiveRadius);
      });

      const total = filtered.length;
      const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return {
        data: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      };
    }

    // Standard database pagination when no geo filter is specified
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: ALERT_INCLUDE,
        orderBy: { issuedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.alert.count({ where }),
    ]);

    return {
      data: alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Retrieve an alert by UUID.
   *
   * @param {string} id - Alert UUID
   * @returns {Promise<Object>} Alert details
   */
  async getAlertById(id) {
    if (!UUID_REGEX.test(id)) {
      const error = new Error('Alert does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: ALERT_INCLUDE,
    });

    if (!alert) {
      const error = new Error('Alert does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return alert;
  }

  /**
   * Update an existing alert.
   * Enforces role authorization: ADMIN can update any alert; AUTHORITY can only update their own alert.
   *
   * @param {string} id - Alert UUID
   * @param {Object} data - Validated update fields
   * @param {Object} user - Authenticated user context ({ id, role })
   * @returns {Promise<Object>} Updated alert
   */
  async updateAlert(id, data, user) {
    const existing = await this.getAlertById(id);

    // Enforce role authorization
    if (user.role !== 'ADMIN') {
      if (user.role === 'AUTHORITY') {
        if (existing.issuedById !== user.id) {
          const error = new Error(
            'Forbidden: You are not authorized to update this alert. Only the issuing authority or an administrator may update it.'
          );
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }
      } else {
        const error = new Error('Forbidden: Insufficient permissions to update alerts.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
    }

    // Validate changed disaster relationship if provided
    if (data.disasterId && data.disasterId !== existing.disasterId) {
      const disaster = await prisma.disaster.findUnique({
        where: { id: data.disasterId },
      });
      if (!disaster) {
        const error = new Error(`Referenced disaster with ID '${data.disasterId}' does not exist.`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }
    }

    // Explicit field whitelisting (mass-assignment protection)
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.radius !== undefined) updateData.radius = data.radius;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.disasterId !== undefined) {
      updateData.disaster = { connect: { id: data.disasterId } };
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: updateData,
      include: ALERT_INCLUDE,
    });

    // If alert status or details updated and alert is ACTIVE, notify users
    if (updated.status === 'ACTIVE' && (data.status || data.severity || data.description)) {
      await notificationService.handleAlertCreatedOrUpdated({
        alert: updated,
        actionType: 'UPDATED',
      });
    }

    return updated;
  }

  /**
   * Delete an alert.
   * Restricted to ADMIN role only per specification.
   *
   * @param {string} id - Alert UUID
   * @param {Object} user - Authenticated user context
   * @returns {Promise<void>}
   */
  async deleteAlert(id, user) {
    await this.getAlertById(id);

    if (user.role !== 'ADMIN') {
      const error = new Error('Forbidden: Only platform administrators can delete alerts.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    try {
      await prisma.alert.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2003') {
        const err = new Error('Cannot delete this alert because dependent records reference it.');
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new AlertService();

