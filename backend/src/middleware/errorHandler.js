const config = require('../config/env');

/**
 * Centralized error-handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  console.error(`[Error] ${statusCode} - ${message}`);
  if (config.nodeEnv === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
