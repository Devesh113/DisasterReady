const { z } = require('zod');

/**
 * Valid AlertSeverity enum values matching the Prisma schema
 */
const ALERT_SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

/**
 * Valid AlertStatus enum values matching the Prisma schema
 */
const ALERT_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'];

/**
 * Valid DisasterType enum values matching the Prisma schema
 */
const DISASTER_TYPES = [
  'EARTHQUAKE',
  'FLOOD',
  'CYCLONE',
  'TSUNAMI',
  'WILDFIRE',
  'LANDSLIDE',
  'DROUGHT',
  'VOLCANIC_ERUPTION',
  'TORNADO',
  'INDUSTRIAL_ACCIDENT',
  'OTHER',
];

/**
 * Validation schema for creating a new alert (POST /api/v1/alerts)
 * Maps directly to the DisasterReady Alert model and API_CONTRACTS.md
 */
const createAlertSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description must not exceed 5000 characters'),
  severity: z.enum(ALERT_SEVERITIES, {
    errorMap: () => ({ message: `Severity must be one of: ${ALERT_SEVERITIES.join(', ')}` }),
  }),
  status: z
    .enum(ALERT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${ALERT_STATUSES.join(', ')}` }),
    })
    .default('ACTIVE')
    .optional(),
  latitude: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),
  longitude: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),
  radius: z.coerce
    .number({ invalid_type_error: 'Radius must be a valid number' })
    .positive('Radius must be a positive number')
    .optional()
    .nullable(),
  expiresAt: z.coerce
    .date({ invalid_type_error: 'Expires at must be a valid ISO 8601 date string' })
    .optional()
    .nullable(),
  disasterId: z
    .string({ required_error: 'Disaster ID is required' })
    .uuid('Disaster ID must be a valid UUID'),
});

/**
 * Validation schema for updating an alert (PATCH /api/v1/alerts/:id)
 * All fields are optional for partial updates
 */
const updateAlertSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  severity: z
    .enum(ALERT_SEVERITIES, {
      errorMap: () => ({ message: `Severity must be one of: ${ALERT_SEVERITIES.join(', ')}` }),
    })
    .optional(),
  status: z
    .enum(ALERT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${ALERT_STATUSES.join(', ')}` }),
    })
    .optional(),
  latitude: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),
  longitude: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),
  radius: z.coerce
    .number({ invalid_type_error: 'Radius must be a valid number' })
    .positive('Radius must be a positive number')
    .optional()
    .nullable(),
  expiresAt: z.coerce
    .date({ invalid_type_error: 'Expires at must be a valid ISO 8601 date string' })
    .optional()
    .nullable(),
  disasterId: z
    .string()
    .uuid('Disaster ID must be a valid UUID')
    .optional(),
});

/**
 * Validation schema for query parameters on GET /api/v1/alerts
 */
const queryAlertSchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .default(10),
  severity: z
    .enum(ALERT_SEVERITIES, {
      errorMap: () => ({ message: `Severity must be one of: ${ALERT_SEVERITIES.join(', ')}` }),
    })
    .optional(),
  status: z
    .enum(ALERT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${ALERT_STATUSES.join(', ')}` }),
    })
    .optional(),
  disasterId: z
    .string()
    .uuid('Disaster ID must be a valid UUID')
    .optional(),
  disasterType: z
    .enum(DISASTER_TYPES, {
      errorMap: () => ({ message: `Disaster type must be one of: ${DISASTER_TYPES.join(', ')}` }),
    })
    .optional(),
  search: z
    .string()
    .trim()
    .max(200, 'Search query must not exceed 200 characters')
    .optional(),
  latitude: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  radius: z.coerce
    .number({ invalid_type_error: 'Radius must be a valid number' })
    .positive('Radius must be a positive number')
    .optional(),
  radiusKm: z.coerce
    .number({ invalid_type_error: 'Radius in km must be a valid number' })
    .positive('Radius must be a positive number')
    .optional(),
});

module.exports = {
  createAlertSchema,
  updateAlertSchema,
  queryAlertSchema,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  DISASTER_TYPES,
};
