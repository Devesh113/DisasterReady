const { prisma } = require("../config/db");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Service managing user notifications, lifecycle state, read markers,
 * and domain event dispatch triggers.
 */
class NotificationService {
  /**
   * Retrieve paginated notifications belonging exclusively to the authenticated user.
   *
   * @param {string} userId - Authenticated user UUID
   * @param {Object} query - Filtering and pagination options
   * @returns {Promise<Object>} Notifications list and pagination metadata
   */
  async getUserNotifications(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = {
      userId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Count total unread notifications for the authenticated user.
   *
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Object containing unreadCount
   */
  async getUnreadCount(userId) {
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  /**
   * Retrieve a single notification by ID.
   * Enforces strict user ownership: if the notification belongs to another user
   * or does not exist, a 404 NOT_FOUND is returned to prevent enumeration.
   *
   * @param {string} id - Notification UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Notification record
   */
  async getNotificationById(id, userId) {
    if (!UUID_REGEX.test(id)) {
      const error = new Error(
        "Notification does not exist or does not belong to user",
      );
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      const error = new Error(
        "Notification does not exist or does not belong to user",
      );
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return notification;
  }

  /**
   * Mark a single notification as read.
   * Enforces ownership per API_CONTRACTS.md.
   *
   * @param {string} id - Notification UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Updated notification status
   */
  async markAsRead(id, userId) {
    // 1. Verify existence and ownership
    await this.getNotificationById(id, userId);

    // 2. Mark as read
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      isRead: updated.isRead,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mark all unread notifications for the authenticated user as read.
   *
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Object containing updatedCount
   */
  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  /**
   * Delete a single notification.
   * Enforces ownership per API_CONTRACTS.md.
   *
   * @param {string} id - Notification UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<void>}
   */
  async deleteNotification(id, userId) {
    // 1. Verify existence and ownership
    await this.getNotificationById(id, userId);

    // 2. Delete notification
    await prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Programmatically create a notification record.
   *
   * @param {Object} data - Notification fields ({ userId, type, title, message })
   * @returns {Promise<Object>} Created notification record
   */
  async createNotification(data) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type || "GENERAL",
        title: data.title,
        message: data.message,
      },
    });
  }

  /**
   * Safe notification creation wrapper.
   * Catches and logs any unexpected notification creation error without throwing,
   * guaranteeing that the triggering business operation is never rolled back or
   * marked as failed solely due to an in-app notification failure.
   *
   * @param {Object} data - Notification fields
   * @returns {Promise<Object|null>} Created notification or null on failure
   */
  async createNotificationSafe(data) {
    try {
      return await this.createNotification(data);
    } catch (err) {
      console.error(
        "[NotificationService] Safe notification creation failed:",
        err.message,
      );
      return null;
    }
  }

  // ==========================================================================
  // Domain Event Notification Triggers
  // ==========================================================================

  /**
   * Triggered when an Incident Report changes status.
   * Notifies the reporting citizen of the review/resolution update.
   *
   * @param {Object} params - { incident, oldStatus, newStatus }
   * @returns {Promise<Object|null>}
   */
  async handleIncidentStatusChange({ incident, oldStatus, newStatus }) {
    if (!incident || !incident.reportedById || oldStatus === newStatus) {
      return null;
    }

    const title = `Incident Report Status: ${newStatus}`;
    const message = `Your report "${incident.title}" has been updated from ${oldStatus} to ${newStatus}.`;

    return this.createNotificationSafe({
      userId: incident.reportedById,
      type: "INCIDENT_UPDATE",
      title,
      message,
    });
  }

  /**
   * Triggered when an Emergency Alert is published or updated.
   * Notifies active users across the platform according to supported targeting logic.
   * Preserves distinction between live emergency alerts and mock/demonstration alerts.
   *
   * @param {Object} params - { alert, actionType, targetUserIds }
   * @returns {Promise<number>} Number of notifications dispatched
   */
  async handleAlertCreatedOrUpdated({
    alert,
    actionType = "CREATED",
    targetUserIds = null,
  }) {
    if (!alert || alert.status !== "ACTIVE") {
      return 0;
    }

    // Check for demo/drill designation in title or description
    const isDemo =
      /\[?(demo|drill|test|simulation)\]?/i.test(alert.title) ||
      /\[?(demo|drill|test|simulation)\]?/i.test(alert.description);

    const prefix = isDemo ? "[DEMO ALERT] " : "[EMERGENCY ALERT] ";
    const title = `${prefix}${alert.title} (${alert.severity})`;
    const message = alert.description;

    // Determine target recipients
    let recipients = targetUserIds;
    if (!recipients) {
      // Find all active users (excluding issuing authority)
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          ...(alert.issuedById ? { id: { not: alert.issuedById } } : {}),
        },
        select: { id: true },
      });
      recipients = users.map((u) => u.id);
    }

    if (!recipients || recipients.length === 0) {
      return 0;
    }

    // Bulk insert notifications
    const createData = recipients.map((uid) => ({
      userId: uid,
      type: "ALERT",
      title,
      message,
    }));

    try {
      const result = await prisma.notification.createMany({
        data: createData,
      });
      return result.count;
    } catch (err) {
      console.error(
        "[NotificationService] Bulk alert notification creation failed:",
        err.message,
      );
      return 0;
    }
  }

  /**
   * Triggered when a citizen registers for an event.
   * Notifies the registering user of confirmed registration.
   *
   * @param {Object} params - { userId, event }
   * @returns {Promise<Object|null>}
   */
  async handleEventRegistration({ userId, event }) {
    if (!userId || !event) {
      return null;
    }

    const title = `Event Registration Confirmed: ${event.title}`;
    const dateStr = event.startDate
      ? new Date(event.startDate).toLocaleDateString()
      : "Scheduled date";
    const message = `You have successfully registered for "${event.title}". Event date: ${dateStr}. Location: ${event.location || "TBA"}.`;

    return this.createNotificationSafe({
      userId,
      type: "EVENT_REMINDER",
      title,
      message,
    });
  }

  /**
   * Triggered when an event is updated or cancelled.
   * Notifies all users currently registered for that specific event.
   *
   * @param {Object} params - { event, updateType, updateDetails }
   * @returns {Promise<number>} Number of attendees notified
   */
  async handleEventUpdate({
    event,
    updateType = "UPDATE",
    updateDetails = null,
  }) {
    if (!event || !event.id) {
      return 0;
    }

    // Find all registered attendees for this event
    const registrations = await prisma.registration.findMany({
      where: { eventId: event.id },
      select: { userId: true },
    });

    if (registrations.length === 0) {
      return 0;
    }

    const isCancelled =
      updateType === "CANCELLED" || event.status === "CANCELLED";
    const title = isCancelled
      ? `Event Cancelled: ${event.title}`
      : `Event Schedule Update: ${event.title}`;

    const defaultMsg = isCancelled
      ? `The event "${event.title}" has been cancelled.`
      : `The schedule or details for "${event.title}" have been updated. Please review the updated event info.`;

    const message = updateDetails || defaultMsg;

    const createData = registrations.map((r) => ({
      userId: r.userId,
      type: "EVENT_REMINDER",
      title,
      message,
    }));

    try {
      const result = await prisma.notification.createMany({
        data: createData,
      });
      return result.count;
    } catch (err) {
      console.error(
        "[NotificationService] Bulk event update notification creation failed:",
        err.message,
      );
      return 0;
    }
  }
}

module.exports = new NotificationService();
