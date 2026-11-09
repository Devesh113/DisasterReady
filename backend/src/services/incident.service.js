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
 * Valid state transitions for incident reports:
 * SUBMITTED → UNDER_REVIEW → VERIFIED → RESOLVED
 * REJECTED can be reached from SUBMITTED, UNDER_REVIEW, or VERIFIED.
 * Administrators can reopen resolved or rejected reports back to UNDER_REVIEW.
 */
const VALID_STATUS_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
  UNDER_REVIEW: ['VERIFIED', 'RESOLVED', 'REJECTED'],
  VERIFIED: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['UNDER_REVIEW'],
  REJECTED: ['UNDER_REVIEW'],
};

/**
 * Selection fields for reportedBy to safely expose reporter info without password hashes
 */
const REPORTER_LIST_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
};

const REPORTER_DETAIL_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
};

/**
 * Service managing Incident Reports lifecycle, review, verification,
 * and geospatial proximity filtering.
 */
class IncidentService {
  /**
   * Submit a new incident report.
   * Assigns reporter strictly from the authenticated JWT user.
   *
   * @param {Object} data - Validated incident data
   * @param {Object} user - Authenticated user context ({ id, role })
   * @returns {Promise<Object>} Created incident report
   */
  async createIncident(data, user) {
    const report = await prisma.incidentReport.create({
      data: {
        title: data.title,
        description: data.description,
        status: 'SUBMITTED',
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address ?? null,
        imageUrl: data.imageUrl ?? null,
        reportedBy: { connect: { id: user.id } },
      },
      include: {
        reportedBy: { select: REPORTER_LIST_SELECT },
      },
    });

    return report;
  }

  /**
   * List all incident reports with pagination, filtering, and optional geo proximity.
   * Restricted to AUTHORITY and ADMIN roles per API_CONTRACTS.md.
   *
   * @param {Object} queryParams
   * @returns {Promise<{ data: Object[], pagination: Object }>}
   */
  async getAllIncidents({
    page = 1,
    limit = 10,
    status,
    search,
    latitude,
    longitude,
    radius,
    radiusKm,
    reportedById,
  }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (reportedById) {
      where.reportedById = reportedById;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
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
      // 1. Candidate pre-filter bounding box to prevent full-table scans
      const bbox = getBoundingBox(latitude, longitude, effectiveRadius);
      where.latitude = { gte: bbox.minLat, lte: bbox.maxLat };
      where.longitude = { gte: bbox.minLon, lte: bbox.maxLon };

      const candidates = await prisma.incidentReport.findMany({
        where,
        include: {
          reportedBy: { select: REPORTER_LIST_SELECT },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 2. Exact Great-Circle distance filtering
      const filtered = candidates.filter((item) => {
        if (item.latitude === null || item.longitude === null) return false;
        return isWithinRadius(latitude, longitude, item.latitude, item.longitude, effectiveRadius);
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

    // Standard database pagination
    const [reports, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        include: {
          reportedBy: { select: REPORTER_LIST_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.incidentReport.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Retrieve incident reports submitted by the authenticated user.
   *
   * @param {string} userId - User ID from JWT
   * @param {Object} queryParams
   * @returns {Promise<{ data: Object[], pagination: Object }>}
   */
  async getUserIncidents(userId, { page = 1, limit = 10, status }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const where = { reportedById: userId };

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.incidentReport.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Retrieve single incident report by ID with access control.
   * Accessible by AUTHORITY, ADMIN, or the submitting citizen.
   *
   * @param {string} id - Report UUID
   * @param {Object} user - Authenticated user context
   * @returns {Promise<Object>}
   */
  async getIncidentById(id, user) {
    if (!UUID_REGEX.test(id)) {
      const error = new Error('Incident report does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const report = await prisma.incidentReport.findUnique({
      where: { id },
      include: {
        reportedBy: { select: REPORTER_DETAIL_SELECT },
      },
    });

    if (!report) {
      const error = new Error('Incident report does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Access control: CITIZEN can only view their own report
    if (user.role === 'CITIZEN' && report.reportedById !== user.id) {
      const error = new Error('Forbidden: You are not authorized to view another user\'s incident report.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return report;
  }

  /**
   * Update an incident report.
   * - CITIZEN can update content of their own report only while still SUBMITTED.
   * - CITIZEN cannot change status.
   * - AUTHORITY and ADMIN can advance status through valid workflow states.
   *
   * @param {string} id - Report UUID
   * @param {Object} data - Update data
   * @param {Object} user - Authenticated user context
   * @returns {Promise<Object>} Updated report
   */
  async updateIncident(id, data, user) {
    if (!UUID_REGEX.test(id)) {
      const error = new Error('Incident report does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const report = await prisma.incidentReport.findUnique({
      where: { id },
    });

    if (!report) {
      const error = new Error('Incident report does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updateData = {};

    if (user.role === 'CITIZEN') {
      // Citizen ownership check
      if (report.reportedById !== user.id) {
        const error = new Error('Forbidden: You cannot modify another user\'s incident report.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Citizen cannot change status
      if (data.status && data.status !== report.status) {
        const error = new Error('Forbidden: Citizens are not permitted to change incident report status.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }

      // Citizen can only modify before review begins
      if (report.status !== 'SUBMITTED') {
        const error = new Error('Cannot modify an incident report that is already under review or processed.');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      // Allow updating content fields
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
    } else {
      // AUTHORITY or ADMIN updating status or content
      if (data.status && data.status !== report.status) {
        const allowedTransitions = VALID_STATUS_TRANSITIONS[report.status] || [];
        if (!allowedTransitions.includes(data.status)) {
          const error = new Error(
            `Invalid status transition: Cannot move incident report from '${report.status}' to '${data.status}'. Permitted transitions: ${allowedTransitions.join(', ') || 'none'}`
          );
          error.statusCode = 400;
          error.code = 'VALIDATION_ERROR';
          throw error;
        }
        updateData.status = data.status;
      }

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
    }

    const updated = await prisma.incidentReport.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: { select: REPORTER_LIST_SELECT },
      },
    });

    // Notify citizen if status was updated
    if (data.status && data.status !== report.status) {
      await notificationService.handleIncidentStatusChange({
        incident: updated,
        oldStatus: report.status,
        newStatus: data.status,
      });
    }

    return updated;
  }

  /**
   * Delete an incident report.
   * Restricted strictly to ADMIN role.
   *
   * @param {string} id - Report UUID
   * @param {Object} user - Authenticated user context
   * @returns {Promise<void>}
   */
  async deleteIncident(id, user) {
    if (!UUID_REGEX.test(id)) {
      const error = new Error('Incident report does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (user.role !== 'ADMIN') {
      const error = new Error('Forbidden: Only platform administrators can delete incident reports.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const report = await prisma.incidentReport.findUnique({
      where: { id },
    });

    if (!report) {
      const error = new Error('Incident report does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    try {
      await prisma.incidentReport.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2003') {
        const err = new Error('Cannot delete this incident report because dependent records reference it.');
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new IncidentService();

