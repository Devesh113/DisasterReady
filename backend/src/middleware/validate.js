const { sendError } = require('../utils/response');

/**
 * Reusable request body validation middleware using Zod schemas
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || [];
    const details = issues.map((err) => ({
      field: Array.isArray(err.path) ? err.path.join('.') : '',
      message: err.message,
    }));

    return sendError(
      res,
      400,
      'Validation failed. Please check your request parameters.',
      'VALIDATION_ERROR',
      details
    );
  }

  // Assign normalized & validated data back to req.body
  req.body = result.data;
  next();
};

module.exports = validate;
