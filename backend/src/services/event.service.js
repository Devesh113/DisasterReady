const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const notificationService = require("./notification.service");
const {
  getBoundingBox,
  calculateHaversineDistance,
  isValidCoordinates,
  isValidRadius,
} = require("../utils/geo");

const ORGANIZER_LIST_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
};

const ORGANIZER_DETAIL_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
};

/**
 * Event Service
 * Manages community drills, preparedness workshops, and training events.
 */
class EventService {
  /**
   * List events with filtering, pagination, and optional geo proximity
   * @param {Object} query - Validated query parameters
   * @returns {Promise<{ events: Object[], pagination: Object }>}
   */
  async listEvents(query) {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      search,
      latitude,
      longitude,
      radiusKm,
      radius,
      sortBy = "startDate",
      sortOrder = "asc",
    } = query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate) {
      whereClause.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      whereClause.endDate = { lte: new Date(endDate) };
    }

    if (search) {
      const term = search.trim();
      whereClause.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
      ];
    }

    const effectiveRadius = radiusKm !== undefined ? radiusKm : radius;
    const hasGeo =
      latitude !== undefined &&
      longitude !== undefined &&
      effectiveRadius !== undefined &&
      isValidCoordinates(latitude, longitude) &&
      isValidRadius(effectiveRadius);

    if (hasGeo) {
      const bbox = getBoundingBox(latitude, longitude, effectiveRadius);
      whereClause.latitude = { gte: bbox.minLat, lte: bbox.maxLat };
      whereClause.longitude = { gte: bbox.minLon, lte: bbox.maxLon };

      const candidates = await prisma.event.findMany({
        where: whereClause,
        include: {
          organizer: { select: ORGANIZER_LIST_SELECT },
          _count: {
            select: {
              registrations: { where: { status: "REGISTERED" } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      });

      const filtered = candidates
        .filter((evt) => {
          if (evt.latitude === null || evt.longitude === null) return false;
          return true;
        })
        .map((evt) => {
          const dist = calculateHaversineDistance(
            latitude,
            longitude,
            evt.latitude,
            evt.longitude,
          );
          return {
            ...evt,
            registrationCount: evt._count.registrations,
            distanceKm: Math.round(dist * 100) / 100,
          };
        })
        .filter((evt) => evt.distanceKm <= effectiveRadius)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      // Clean up internal _count property
      filtered.forEach((e) => delete e._count);

      const total = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      return {
        events: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [total, rawEvents] = await Promise.all([
      prisma.event.count({ where: whereClause }),
      prisma.event.findMany({
        where: whereClause,
        include: {
          organizer: { select: ORGANIZER_LIST_SELECT },
          _count: {
            select: {
              registrations: { where: { status: "REGISTERED" } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const events = rawEvents.map((evt) => {
      const { _count, ...rest } = evt;
      return {
        ...rest,
        registrationCount: _count.registrations,
      };
    });

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get event details by ID
   * @param {string} id - Event UUID
   * @returns {Promise<Object>} Event details with registrationCount and organizer
   */
  async getEventById(id) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: ORGANIZER_DETAIL_SELECT },
        _count: {
          select: {
            registrations: { where: { status: "REGISTERED" } },
          },
        },
      },
    });

    if (!event) {
      throw new ApiError(404, "Event not found.", "NOT_FOUND");
    }

    const { _count, ...rest } = event;
    return {
      ...rest,
      registrationCount: _count.registrations,
    };
  }

  /**
   * Create a new event
   * @param {Object} data - Validated event data
   * @param {Object} user - Authenticated user context
   * @returns {Promise<Object>} Created event
   */
  async createEvent(data, user) {
    if (!["ADMIN", "AUTHORITY"].includes(user.role)) {
      throw new ApiError(
        403,
        "Only AUTHORITY or ADMIN users can create events.",
        "FORBIDDEN",
      );
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity ?? null,
        status: data.status || "UPCOMING",
        organizerId: user.id,
      },
      include: {
        organizer: { select: ORGANIZER_LIST_SELECT },
      },
    });

    return event;
  }

  /**
   * Update an event with authorization check and notification dispatch
   * @param {string} id - Event UUID
   * @param {Object} data - Update data
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(id, data, user) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Event not found.", "NOT_FOUND");
    }

    // Role check: ADMIN can update any event; AUTHORITY must be the organizer
    if (user.role !== "ADMIN" && existing.organizerId !== user.id) {
      throw new ApiError(
        403,
        "Forbidden: You are not authorized to update this event.",
        "FORBIDDEN",
      );
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(
        400,
        "No valid fields provided for update.",
        "VALIDATION_ERROR",
      );
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        organizer: { select: ORGANIZER_LIST_SELECT },
      },
    });

    // Notify registered attendees if status changed or critical schedule changed
    const statusChanged = data.status && data.status !== existing.status;
    const scheduleChanged =
      (data.startDate &&
        new Date(data.startDate).getTime() !== existing.startDate.getTime()) ||
      (data.endDate &&
        new Date(data.endDate).getTime() !== existing.endDate.getTime()) ||
      (data.location && data.location !== existing.location);

    if (statusChanged && updated.status === "CANCELLED") {
      await notificationService.handleEventUpdate({
        event: updated,
        updateType: "CANCELLED",
        updateDetails: `The event "${updated.title}" scheduled for ${updated.startDate.toLocaleDateString()} has been cancelled.`,
      });
    } else if (statusChanged || scheduleChanged) {
      await notificationService.handleEventUpdate({
        event: updated,
        updateType: "UPDATE",
        updateDetails: `The details or schedule for "${updated.title}" have been updated. Location: ${updated.location}.`,
      });
    }

    return updated;
  }

  /**
   * Delete an event permanently (ADMIN only)
   * Safely deletes associated registrations first to maintain database integrity
   * @param {string} id - Event UUID
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>} Deletion result
   */
  async deleteEvent(id, user) {
    if (user.role !== "ADMIN") {
      throw new ApiError(
        403,
        "Forbidden: Only administrators can delete events.",
        "FORBIDDEN",
      );
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Event not found.", "NOT_FOUND");
    }

    // Notify attendees before deletion if event was not already cancelled
    if (existing.status !== "CANCELLED") {
      await notificationService.handleEventUpdate({
        event: existing,
        updateType: "CANCELLED",
        updateDetails: `The event "${existing.title}" has been cancelled and removed.`,
      });
    }

    // Atomic transaction: remove registrations then event
    await prisma.$transaction([
      prisma.registration.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return { id, deleted: true };
  }
}

module.exports = new EventService();
