const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Generate a short-lived Access Token (JWT)
 * @param {Object} payload - User claims (userId, email, role)
 * @returns {string} Signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

/**
 * Verify a JWT Access Token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Generate a high-entropy cryptographically random Refresh Token (64 bytes = 128 hex chars)
 * @returns {string}
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Calculate the expiration timestamp for a refresh token
 * @param {number} days
 * @returns {Date}
 */
const getRefreshTokenExpiry = (days = config.jwt.refreshExpiryDays) => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
};
