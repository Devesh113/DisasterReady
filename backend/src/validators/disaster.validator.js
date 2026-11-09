const { z } = require('zod');

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
 * Validation schema for creating a new disaster (POST /api/v1/disasters)
 * Maps directly to the DisasterReady Disaster model and API_CONTRACTS.md
 */
const createDisasterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  type: z.enum(DISASTER_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${DISASTER_TYPES.join(', ')}` }),
  }),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description must not exceed 2000 characters'),
  guidelines: z
    .string()
    .trim()
    .max(5000, 'Guidelines must not exceed 5000 characters')
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .url('Icon URL must be a valid URL')
    .optional()
    .nullable(),
});

/**
 * Validation schema for updating a disaster (PATCH /api/v1/disasters/:id)
 * All fields are optional for partial updates
 */
const updateDisasterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  type: z.enum(DISASTER_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${DISASTER_TYPES.join(', ')}` }),
  }).optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  guidelines: z
    .string()
    .trim()
    .max(5000, 'Guidelines must not exceed 5000 characters')
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .url('Icon URL must be a valid URL')
    .optional()
    .nullable(),
});

/**
 * Validation schema for query parameters on GET /api/v1/disasters
 */
const queryDisasterSchema = z.object({
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
  type: z.enum(DISASTER_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${DISASTER_TYPES.join(', ')}` }),
  }).optional(),
  search: z
    .string()
    .trim()
    .max(200, 'Search query must not exceed 200 characters')
    .optional(),
});

module.exports = {
  createDisasterSchema,
  updateDisasterSchema,
  queryDisasterSchema,
  DISASTER_TYPES,
};

