const { z } = require("zod");

/**
 * Valid RegistrationStatus enum values matching the Prisma schema
 */
const REGISTRATION_STATUSES = ["REGISTERED", "ATTENDED", "CANCELLED"];

/**
 * Validation schema for query parameters on registrations
 */
const queryRegistrationSchema = z.object({
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
    .enum(REGISTRATION_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${REGISTRATION_STATUSES.join(", ")}`,
      }),
    })
    .optional(),
});

/**
 * Validation schema for updating registration status (e.g. marking ATTENDED)
 */
const updateRegistrationStatusSchema = z.object({
  status: z.enum(REGISTRATION_STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${REGISTRATION_STATUSES.join(", ")}`,
    }),
  }),
});

module.exports = {
  queryRegistrationSchema,
  updateRegistrationStatusSchema,
  REGISTRATION_STATUSES,
};
