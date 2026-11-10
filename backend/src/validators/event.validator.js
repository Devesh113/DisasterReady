const { z } = require("zod");

/**
 * Valid EventStatus enum values matching the Prisma schema
 */
const EVENT_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

/**
 * Validation schema for creating a new event (POST /api/v1/events)
 */
const createEventSchema = z
  .object({
    title: z
      .string({ required_error: "Title is required" })
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must not exceed 200 characters"),
    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(1, "Description is required")
      .max(5000, "Description must not exceed 5000 characters"),
    location: z
      .string({ required_error: "Location is required" })
      .trim()
      .min(1, "Location is required")
      .max(300, "Location must not exceed 300 characters"),
    latitude: z.coerce
      .number({ invalid_type_error: "Latitude must be a valid number" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional()
      .nullable(),
    longitude: z.coerce
      .number({ invalid_type_error: "Longitude must be a valid number" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional()
      .nullable(),
    startDate: z.coerce.date({
      required_error: "Start date is required",
      invalid_type_error: "Start date must be a valid ISO 8601 date string",
    }),
    endDate: z.coerce.date({
      required_error: "End date is required",
      invalid_type_error: "End date must be a valid ISO 8601 date string",
    }),
    capacity: z.coerce
      .number({ invalid_type_error: "Capacity must be a valid number" })
      .int("Capacity must be an integer")
      .positive("Capacity must be a positive number")
      .optional()
      .nullable(),
    status: z
      .enum(EVENT_STATUSES, {
        errorMap: () => ({
          message: `Status must be one of: ${EVENT_STATUSES.join(", ")}`,
        }),
      })
      .default("UPCOMING")
      .optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be strictly after start date",
    path: ["endDate"],
  });

/**
 * Validation schema for updating an event (PATCH /api/v1/events/:id)
 */
const updateEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(200, "Title must not exceed 200 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(1, "Description cannot be empty")
      .max(5000, "Description must not exceed 5000 characters")
      .optional(),
    location: z
      .string()
      .trim()
      .min(1, "Location cannot be empty")
      .max(300, "Location must not exceed 300 characters")
      .optional(),
    latitude: z.coerce
      .number({ invalid_type_error: "Latitude must be a valid number" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional()
      .nullable(),
    longitude: z.coerce
      .number({ invalid_type_error: "Longitude must be a valid number" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional()
      .nullable(),
    startDate: z.coerce
      .date({
        invalid_type_error: "Start date must be a valid ISO 8601 date string",
      })
      .optional(),
    endDate: z.coerce
      .date({
        invalid_type_error: "End date must be a valid ISO 8601 date string",
      })
      .optional(),
    capacity: z.coerce
      .number({ invalid_type_error: "Capacity must be a valid number" })
      .int("Capacity must be an integer")
      .positive("Capacity must be a positive number")
      .optional()
      .nullable(),
    status: z
      .enum(EVENT_STATUSES, {
        errorMap: () => ({
          message: `Status must be one of: ${EVENT_STATUSES.join(", ")}`,
        }),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be strictly after start date",
      path: ["endDate"],
    },
  );

/**
 * Validation schema for query parameters on GET /api/v1/events
 */
const queryEventSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(10),
  status: z
    .enum(EVENT_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${EVENT_STATUSES.join(", ")}`,
      }),
    })
    .optional(),
  startDate: z.coerce
    .date({
      invalid_type_error: "Start date must be a valid ISO 8601 date string",
    })
    .optional(),
  endDate: z.coerce
    .date({
      invalid_type_error: "End date must be a valid ISO 8601 date string",
    })
    .optional(),
  search: z
    .string()
    .trim()
    .max(200, "Search query must not exceed 200 characters")
    .optional(),
  latitude: z.coerce
    .number({ invalid_type_error: "Latitude must be a valid number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z.coerce
    .number({ invalid_type_error: "Longitude must be a valid number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  radiusKm: z.coerce
    .number({ invalid_type_error: "Radius must be a valid number" })
    .positive("Radius must be a positive number")
    .max(500, "Radius cannot exceed 500 km")
    .optional(),
  radius: z.coerce
    .number({ invalid_type_error: "Radius must be a valid number" })
    .positive("Radius must be a positive number")
    .max(500, "Radius cannot exceed 500 km")
    .optional(),
  sortBy: z
    .enum(["startDate", "createdAt", "title"], {
      errorMap: () => ({
        message: "sortBy must be one of: startDate, createdAt, title",
      }),
    })
    .default("startDate"),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "sortOrder must be asc or desc" }),
    })
    .default("asc"),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  queryEventSchema,
  EVENT_STATUSES,
};
