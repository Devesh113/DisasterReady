const { z } = require("zod");

/**
 * Valid ResourceType enum values matching the Prisma schema
 */
const RESOURCE_TYPES = [
  "SHELTER",
  "HOSPITAL",
  "FIRE_STATION",
  "POLICE_STATION",
  "SUPPLY_CENTER",
  "EVACUATION_POINT",
  "WATER_SOURCE",
  "OTHER",
];

/**
 * Validation schema for creating an emergency resource (POST /api/v1/emergency-resources)
 */
const createResourceSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters"),
  type: z.enum(RESOURCE_TYPES, {
    errorMap: () => ({
      message: `Type must be one of: ${RESOURCE_TYPES.join(", ")}`,
    }),
  }),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must not exceed 500 characters"),
  latitude: z.coerce
    .number({
      required_error: "Latitude is required",
      invalid_type_error: "Latitude must be a valid number",
    })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce
    .number({
      required_error: "Longitude is required",
      invalid_type_error: "Longitude must be a valid number",
    })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[\d\s\-().]{7,20}$/,
      "Phone number must be a valid format (7–20 digits, may include +, spaces, dashes, parentheses)",
    )
    .optional()
    .nullable(),
  capacity: z.coerce
    .number({ invalid_type_error: "Capacity must be a valid number" })
    .int("Capacity must be a whole number")
    .min(0, "Capacity cannot be negative")
    .optional()
    .nullable(),
  isActive: z.coerce.boolean().default(true).optional(),
});

/**
 * Validation schema for updating an emergency resource (PATCH /api/v1/emergency-resources/:id)
 * All fields optional for partial updates
 */
const updateResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(200, "Name must not exceed 200 characters")
    .optional(),
  type: z
    .enum(RESOURCE_TYPES, {
      errorMap: () => ({
        message: `Type must be one of: ${RESOURCE_TYPES.join(", ")}`,
      }),
    })
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  address: z
    .string()
    .trim()
    .min(1, "Address cannot be empty")
    .max(500, "Address must not exceed 500 characters")
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
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[\d\s\-().]{7,20}$/,
      "Phone number must be a valid format (7–20 digits, may include +, spaces, dashes, parentheses)",
    )
    .optional()
    .nullable(),
  capacity: z.coerce
    .number({ invalid_type_error: "Capacity must be a valid number" })
    .int("Capacity must be a whole number")
    .min(0, "Capacity cannot be negative")
    .optional()
    .nullable(),
  isActive: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
});

/**
 * Validation schema for query parameters on GET /api/v1/emergency-resources
 */
const queryResourceSchema = z.object({
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
  type: z
    .enum(RESOURCE_TYPES, {
      errorMap: () => ({
        message: `Type must be one of: ${RESOURCE_TYPES.join(", ")}`,
      }),
    })
    .optional(),
  isActive: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
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
  sortBy: z
    .enum(["name", "type", "createdAt", "updatedAt"], {
      errorMap: () => ({
        message: "sortBy must be one of: name, type, createdAt, updatedAt",
      }),
    })
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "sortOrder must be asc or desc" }),
    })
    .default("desc"),
});

module.exports = {
  createResourceSchema,
  updateResourceSchema,
  queryResourceSchema,
  RESOURCE_TYPES,
};
