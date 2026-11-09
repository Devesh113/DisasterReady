const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Brute-force protection rate limiter for sensitive authentication endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      429,
      'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

module.exports = {
  authRateLimiter,
};
