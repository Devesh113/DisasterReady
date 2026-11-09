const { z } = require('zod');

/**
 * Valid IncidentReportStatus enum values matching the Prisma schema
 */
const INCIDENT_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'RESOLVED',
  'REJECTED',
];

/**
 * Validation schema for submitting a new incident report (POST /api/v1/incidents)
 * Maps directly to the IncidentReport model in schema.prisma and API_CONTRACTS.md
 */
const createIncidentSchema = z.object({
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
  latitude: z.coerce
    .number({ required_error: 'Latitude is required', invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number({ required_error: 'Longitude is required', invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z
    .string()
    .trim()
    .max(300, 'Address must not exceed 300 characters')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('Image URL must be a valid HTTP or HTTPS URL')
    .max(500, 'Image URL must not exceed 500 characters')
    .refine((url) => /^https?:\/\//i.test(url), {
      message: 'Image URL must use http or https protocol',
    })
    .optional()
    .nullable(),
});

/**
 * Validation schema for updating an incident report (PATCH /api/v1/incidents/:id)
 * Supports status progression by authorities and content updates by report owners
 */
const updateIncidentSchema = z.object({
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
  status: z
    .enum(INCIDENT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${INCIDENT_STATUSES.join(', ')}` }),
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
  address: z
    .string()
    .trim()
    .max(300, 'Address must not exceed 300 characters')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('Image URL must be a valid HTTP or HTTPS URL')
    .max(500, 'Image URL must not exceed 500 characters')
    .refine((url) => /^https?:\/\//i.test(url), {
      message: 'Image URL must use http or https protocol',
    })
    .optional()
    .nullable(),
});

/**
 * Validation schema for query parameters on GET /api/v1/incidents
 */
const queryIncidentSchema = z.object({
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
  status: z
    .enum(INCIDENT_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${INCIDENT_STATUSES.join(', ')}` }),
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
  createIncidentSchema,
  updateIncidentSchema,
  queryIncidentSchema,
  INCIDENT_STATUSES,
};

