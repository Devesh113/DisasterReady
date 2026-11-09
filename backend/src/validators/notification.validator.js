const { z } = require("zod");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOTIFICATION_TYPES = [
  "ALERT",
  "EVENT_REMINDER",
  "INCIDENT_UPDATE",
  "GENERAL",
];

/**
 * Validator for query parameters when listing notifications.
 */
const queryNotificationSchema = z.object({
  page: z.preprocess((val) => {
    if (val === undefined || val === "") return 1;
    const num = parseInt(val, 10);
    return isNaN(num) ? 1 : num;
  }, z.number().int().positive().default(1)),

  limit: z.preprocess((val) => {
    if (val === undefined || val === "") return 10;
    const num = parseInt(val, 10);
    return isNaN(num) ? 10 : Math.min(100, Math.max(1, num));
  }, z.number().int().positive().max(100).default(10)),

  type: z
    .enum(NOTIFICATION_TYPES, {
      errorMap: () => ({
        message: `Invalid notification type. Must be one of: ${NOTIFICATION_TYPES.join(", ")}`,
      }),
    })
    .optional(),

  isRead: z
    .preprocess(
      (val) => {
        if (val === undefined || val === "") return undefined;
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return val;
      },
      z.boolean({
        invalid_type_error: "isRead must be a boolean (true or false)",
      }),
    )
    .optional(),

  sortOrder: z.preprocess(
    (val) => {
      if (val === undefined || val === "") return "desc";
      const lower = String(val).toLowerCase();
      return lower === "asc" ? "asc" : "desc";
    },
    z.enum(["asc", "desc"]).default("desc"),
  ),
});

/**
 * Validator for route parameters requiring a notification UUID.
 */
const notificationIdParamSchema = z.object({
  id: z
    .string()
    .regex(UUID_REGEX, {
      message: "Invalid notification ID format. Must be a valid UUID.",
    }),
});

/**
 * Validator for programmatic or administrative notification creation.
 */
const createNotificationSchema = z.object({
  userId: z
    .string()
    .regex(UUID_REGEX, {
      message: "Invalid user ID format. Must be a valid UUID.",
    }),
  type: z
    .enum(NOTIFICATION_TYPES, {
      errorMap: () => ({
        message: `Invalid notification type. Must be one of: ${NOTIFICATION_TYPES.join(", ")}`,
      }),
    })
    .default("GENERAL"),
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(255, "Title must not exceed 255 characters"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must not exceed 2000 characters"),
});

module.exports = {
  NOTIFICATION_TYPES,
  queryNotificationSchema,
  notificationIdParamSchema,
  createNotificationSchema,
};
