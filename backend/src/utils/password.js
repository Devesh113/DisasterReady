const argon2 = require('argon2');
const crypto = require('crypto');

/**
 * Hash a plain password using Argon2id
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB memory
    timeCost: 3,       // 3 iterations
    parallelism: 4,    // 4 threads
  });
};

/**
 * Verify a plain password against an Argon2id hash
 * @param {string} hash
 * @param {string} password
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (hash, password) => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
};

/**
 * Hash a high-entropy random token (e.g., refresh token) using SHA-256
 * @param {string} token - Raw token string
 * @returns {string} Hex-encoded SHA-256 hash
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a cryptographically secure random token string
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Hex string
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRandomToken,
};

