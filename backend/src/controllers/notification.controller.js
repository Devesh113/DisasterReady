const notificationService = require("../services/notification.service");
const { sendSuccess } = require("../utils/response");

/**
 * Controller handling Notification endpoints.
 */
class NotificationController {
  /**
   * Get authenticated user's notifications with pagination and filtering.
   * GET /api/v1/notifications
   */
  async listNotifications(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await notificationService.getUserNotifications(
        req.user.id,
        query,
      );

      return res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count for the authenticated user.
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.user.id);
      return sendSuccess(
        res,
        200,
        "Unread notification count retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve a specific notification by ID.
   * GET /api/v1/notifications/:id
   */
  async getNotification(req, res, next) {
    try {
      const notification = await notificationService.getNotificationById(
        req.params.id,
        req.user.id,
      );
      return sendSuccess(
        res,
        200,
        "Notification retrieved successfully",
        notification,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a single notification as read.
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(
        req.params.id,
        req.user.id,
      );
      return sendSuccess(res, 200, "Notification marked as read", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read for current user.
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, 200, "All notifications marked as read", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification.
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      await notificationService.deleteNotification(req.params.id, req.user.id);
      return sendSuccess(res, 200, "Notification deleted successfully", null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
