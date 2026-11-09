/**
 * Standardized API response utilities matching API_CONTRACTS.md
 */

const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', code = 'INTERNAL_ERROR', details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
