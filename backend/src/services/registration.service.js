const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const notificationService = require("./notification.service");

const ATTENDEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
};

const EVENT_SUMMARY_SELECT = {
  id: true,
  title: true,
  status: true,
  location: true,
  startDate: true,
  endDate: true,
};

/**
 * Registration Service
 * Handles citizen event registrations, capacity enforcement, race condition protection,
 * attendee lists, and notification dispatch.
 */
class RegistrationService {
  /**
   * Register the authenticated user for an event
   * Enforces capacity limits and duplicate registration prevention atomically.
   *
   * @param {string} eventId - Event UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Created registration
   */
  async registerForEvent(eventId, userId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError(404, "Event not found.", "NOT_FOUND");
    }

    if (event.status !== "UPCOMING") {
      throw new ApiError(
        400,
        `Cannot register for an event that is ${event.status.toLowerCase()}. Only UPCOMING events accept registrations.`,
        "VALIDATION_ERROR",
      );
    }

    // Atomic transaction: serialize concurrent registrations using row-level locking on the event row
    const registration = await prisma.$transaction(async (tx) => {
      // 1. Lock the parent Event row with SELECT ... FOR UPDATE to prevent concurrency race conditions
      const lockedEvents = await tx.$queryRaw`
        SELECT "id", "status", "capacity"
        FROM "events"
        WHERE "id" = ${eventId}
        FOR UPDATE
      `;

      if (!lockedEvents || lockedEvents.length === 0) {
        throw new ApiError(404, "Event not found.", "NOT_FOUND");
      }

      const lockedEvent = lockedEvents[0];

      if (lockedEvent.status !== "UPCOMING") {
        throw new ApiError(
          400,
          `Cannot register for an event that is ${lockedEvent.status.toLowerCase()}. Only UPCOMING events accept registrations.`,
          "VALIDATION_ERROR",
        );
      }

      // 2. Check existing registration
      const existing = await tx.registration.findUnique({
        where: {
          userId_eventId: { userId, eventId },
        },
      });

      if (existing && existing.status === "REGISTERED") {
        throw new ApiError(
          409,
          "You are already registered for this event.",
          "CONFLICT",
        );
      }

      // 3. Capacity check under exclusive row lock
      if (lockedEvent.capacity !== null && lockedEvent.capacity !== undefined) {
        const activeCount = await tx.registration.count({
          where: {
            eventId,
            status: "REGISTERED",
          },
        });

        if (activeCount >= lockedEvent.capacity) {
          throw new ApiError(
            400,
            "Event is at full capacity.",
            "VALIDATION_ERROR",
          );
        }
      }

      // 4. Upsert registration (re-activate if previously cancelled, or create new)
      if (existing) {
        return tx.registration.update({
          where: { id: existing.id },
          data: { status: "REGISTERED" },
        });
      }

      return tx.registration.create({
        data: {
          userId,
          eventId,
          status: "REGISTERED",
        },
      });
    });

    // Notify user of confirmed registration (safe call - won't throw on error)
    await notificationService.handleEventRegistration({
      userId,
      event,
    });

    return registration;
  }

  /**
   * Cancel an event registration by eventId for the authenticated user
   * @param {string} eventId - Event UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Cancelled registration
   */
  async cancelRegistration(eventId, userId) {
    const registration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (!registration || registration.status === "CANCELLED") {
      throw new ApiError(
        404,
        "Registration not found or already cancelled.",
        "NOT_FOUND",
      );
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });

    return updated;
  }

  /**
   * Cancel an event registration by registration ID for the authenticated user
   * @param {string} id - Registration UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>}
   */
  async cancelRegistrationById(id, userId) {
    const registration = await prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new ApiError(404, "Registration not found.", "NOT_FOUND");
    }

    if (registration.userId !== userId) {
      throw new ApiError(
        403,
        "Forbidden: You can only cancel your own registrations.",
        "FORBIDDEN",
      );
    }

    if (registration.status === "CANCELLED") {
      throw new ApiError(
        400,
        "Registration is already cancelled.",
        "VALIDATION_ERROR",
      );
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return updated;
  }

  /**
   * List attendees for a specific event
   * Accessible only by the event organizer or ADMIN
   *
   * @param {string} eventId - Event UUID
   * @param {Object} query - Query params ({ page, limit, status })
   * @param {Object} user - Authenticated user
   * @returns {Promise<{ registrations: Object[], pagination: Object }>}
   */
  async getEventRegistrations(eventId, query, user) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError(404, "Event not found.", "NOT_FOUND");
    }

    // Role check: must be event organizer or ADMIN
    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      throw new ApiError(
        403,
        "Forbidden: You are not authorized to view attendee lists for this event.",
        "FORBIDDEN",
      );
    }

    const { page = 1, limit = 10, status } = query;
    const whereClause = { eventId };

    if (status) {
      whereClause.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where: whereClause }),
      prisma.registration.findMany({
        where: whereClause,
        include: {
          user: { select: ATTENDEE_SELECT },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      registrations,
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
   * Get the authenticated user's event registrations
   * @param {string} userId - Authenticated user UUID
   * @param {Object} query - Query params ({ page, limit, status })
   * @returns {Promise<{ registrations: Object[], pagination: Object }>}
   */
  async getUserRegistrations(userId, query) {
    const { page = 1, limit = 10, status } = query;
    const whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where: whereClause }),
      prisma.registration.findMany({
        where: whereClause,
        include: {
          event: { select: EVENT_SUMMARY_SELECT },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      registrations,
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
   * Get single registration details
   * Accessible by the attendee, the event organizer, or ADMIN
   * @param {string} id - Registration UUID
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>}
   */
  async getRegistrationById(id, user) {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: { select: EVENT_SUMMARY_SELECT },
        user: { select: ATTENDEE_SELECT },
      },
    });

    if (!registration) {
      throw new ApiError(404, "Registration not found.", "NOT_FOUND");
    }

    // Access check: owner or ADMIN
    if (registration.userId !== user.id && user.role !== "ADMIN") {
      // Also check if user is the organizer of the event
      const event = await prisma.event.findUnique({
        where: { id: registration.eventId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== user.id) {
        throw new ApiError(
          403,
          "Forbidden: You are not authorized to view this registration.",
          "FORBIDDEN",
        );
      }
    }

    return registration;
  }
}

module.exports = new RegistrationService();
