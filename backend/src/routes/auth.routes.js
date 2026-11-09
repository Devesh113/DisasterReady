const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimit');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

const router = express.Router();

/**
 * @route   POST /api/auth/register (or /api/v1/auth/register)
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login (or /api/v1/auth/login)
 * @desc    Authenticate user & obtain tokens
 * @access  Public
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotate refresh token and issue new access token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/auth/logout (or /api/v1/auth/logout)
 * @desc    Invalidate current session & clear cookie
 * @access  Public / Authenticated
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me (or /api/v1/auth/me)
 * @desc    Get currently authenticated user's profile
 * @access  Private (Bearer Token required)
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Change user password & revoke all previous sessions
 * @access  Private (Bearer Token required)
 */
router.patch('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
