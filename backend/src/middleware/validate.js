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

/**
 * Reusable query parameter validation middleware using Zod schemas
 * @param {import('zod').ZodSchema} schema
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const issues = result.error.issues || [];
    const details = issues.map((err) => ({
      field: Array.isArray(err.path) ? err.path.join('.') : '',
      message: err.message,
    }));

    return sendError(
      res,
      400,
      'Invalid query parameters.',
      'VALIDATION_ERROR',
      details
    );
  }

  // Assign validated & coerced data to req.validatedQuery and Object.assign to req.query
  req.validatedQuery = result.data;
  req.query = { ...req.query, ...result.data };
  next();
};

module.exports = validate;
module.exports.validateQuery = validateQuery;
