const express = require("express");
const notificationController = require("../controllers/notification.controller");
const { validateQuery } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const {
  queryNotificationSchema,
} = require("../validators/notification.validator");

const router = express.Router();

// All notification endpoints require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    List authenticated user's notifications (supports filter by isRead, type, pagination)
 * @access  Private (Authenticated)
 */
router.get(
  "/",
  validateQuery(queryNotificationSchema),
  notificationController.listNotifications,
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get total count of unread notifications for authenticated user
 * @access  Private (Authenticated)
 */
router.get("/unread-count", notificationController.getUnreadCount);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all unread notifications as read for authenticated user
 * @access  Private (Authenticated)
 */
router.patch("/read-all", notificationController.markAllAsRead);

/**
 * @route   GET /api/v1/notifications/:id
 * @desc    Retrieve a single notification by UUID (own only)
 * @access  Private (Authenticated)
 */
router.get("/:id", notificationController.getNotification);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read (own only)
 * @access  Private (Authenticated)
 */
router.patch("/:id/read", notificationController.markAsRead);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification by UUID (own only)
 * @access  Private (Authenticated)
 */
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
