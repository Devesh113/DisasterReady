const { z } = require('zod');

/**
 * Valid SimulationStatus enum values matching the Prisma schema
 */
const SIMULATION_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'];

/**
 * Helper to normalize difficulty level to integer (1-5)
 */
const parseDifficultyLevel = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'BEGINNER' || upper === 'EASY') return 1;
    if (upper === 'INTERMEDIATE') return 2;
    if (upper === 'MEDIUM') return 3;
    if (upper === 'ADVANCED' || upper === 'HARD') return 4;
    if (upper === 'EXPERT') return 5;
    const num = parseInt(upper, 10);
    if (!isNaN(num) && num >= 1 && num <= 5) return num;
  }
  return 1;
};

/**
 * Validation schema for creating a simulation scenario (POST /api/v1/simulations/scenarios)
 * ADMIN only
 */
const createScenarioSchema = z.object({
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
  difficultyLevel: z
    .union([z.number().int().min(1).max(5), z.string().trim()])
    .transform(parseDifficultyLevel)
    .default(1),
  durationMinutes: z.coerce
    .number({ invalid_type_error: 'Duration must be a number' })
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 minute')
    .max(180, 'Duration cannot exceed 180 minutes')
    .default(10),
  maxScore: z.coerce
    .number({ invalid_type_error: 'Max score must be a number' })
    .int('Max score must be an integer')
    .min(1, 'Max score must be at least 1')
    .max(1000, 'Max score cannot exceed 1000')
    .default(100),
  isActive: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .default(true),
  disasterId: z
    .string({ required_error: 'Disaster ID is required' })
    .uuid('Disaster ID must be a valid UUID'),
});

/**
 * Validation schema for query parameters on GET /api/v1/simulations/scenarios
 */
const queryScenarioSchema = z.object({
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
  difficultyLevel: z
    .union([z.coerce.number().int().min(1).max(5), z.string().trim()])
    .transform(parseDifficultyLevel)
    .optional(),
  disasterId: z.string().uuid('Disaster ID must be a valid UUID').optional(),
  isActive: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  search: z.string().trim().max(200).optional(),
});

/**
 * Validation schema for starting an attempt (POST /api/v1/simulations/attempts)
 */
const createAttemptSchema = z.object({
  scenarioId: z
    .string({ required_error: 'Scenario ID is required' })
    .uuid('Scenario ID must be a valid UUID'),
});

/**
 * Validation schema for updating an attempt (PATCH /api/v1/simulations/attempts/:id)
 */
const updateAttemptSchema = z.object({
  status: z.enum(['COMPLETED', 'ABANDONED'], {
    errorMap: () => ({ message: "Status must be either 'COMPLETED' or 'ABANDONED'" }),
  }),
  score: z.coerce
    .number({ invalid_type_error: 'Score must be a number' })
    .int('Score must be an integer')
    .min(0, 'Score cannot be negative')
    .optional(),
  timeSpentSecs: z.coerce
    .number({ invalid_type_error: 'Time spent must be a number' })
    .int('Time spent must be an integer')
    .min(0, 'Time spent cannot be negative')
    .optional(),
});

/**
 * Validation schema for recording a decision
 * (POST /api/v1/simulations/attempts/:attemptId/decisions)
 */
const recordDecisionSchema = z.object({
  stepNumber: z.coerce
    .number({ required_error: 'Step number is required', invalid_type_error: 'Step number must be an integer' })
    .int('Step number must be an integer')
    .min(1, 'Step number must be at least 1'),
  situation: z
    .string({ required_error: 'Situation is required' })
    .trim()
    .min(1, 'Situation is required')
    .max(2000, 'Situation must not exceed 2000 characters'),
  chosenOption: z
    .string({ required_error: 'Chosen option is required' })
    .trim()
    .min(1, 'Chosen option is required')
    .max(1000, 'Chosen option must not exceed 1000 characters'),
  isCorrect: z.coerce.boolean({ required_error: 'isCorrect is required' }),
  pointsAwarded: z.coerce
    .number({ required_error: 'Points awarded is required', invalid_type_error: 'Points awarded must be an integer' })
    .int('Points awarded must be an integer')
    .min(0, 'Points awarded cannot be negative')
    .default(0),
  timeTakenSecs: z.coerce
    .number({ invalid_type_error: 'Time taken must be an integer' })
    .int('Time taken must be an integer')
    .min(0, 'Time taken cannot be negative')
    .optional()
    .nullable(),
});

/**
 * Validation schema for query parameters on GET /api/v1/users/me/simulations
 */
const queryAttemptSchema = z.object({
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
    .enum(SIMULATION_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${SIMULATION_STATUSES.join(', ')}` }),
    })
    .optional(),
  scenarioId: z.string().uuid('Scenario ID must be a valid UUID').optional(),
});

module.exports = {
  createScenarioSchema,
  queryScenarioSchema,
  createAttemptSchema,
  updateAttemptSchema,
  recordDecisionSchema,
  queryAttemptSchema,
  SIMULATION_STATUSES,
};

