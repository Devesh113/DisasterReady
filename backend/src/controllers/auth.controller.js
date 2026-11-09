const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const { sendSuccess } = require('../utils/response');
const config = require('../config/env');

/**
 * Configure standard secure HTTP-only cookie for Refresh Token
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: config.jwt.refreshExpiryDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

/**
 * Controller handling authentication endpoints for DisasterReady
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register (also mounted at /api/v1/auth/register)
   */
  async register(req, res, next) {
    try {
      const { user, accessToken, rawRefreshToken } = await authService.registerUser(req.body);

      setRefreshTokenCookie(res, rawRefreshToken);

      return sendSuccess(res, 201, 'Registration successful', {
        user,
        token: accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate user credentials
   * POST /api/auth/login (also mounted at /api/v1/auth/login)
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, rawRefreshToken } = await authService.loginUser({ email, password });

      setRefreshTokenCookie(res, rawRefreshToken);

      return sendSuccess(res, 200, 'Login successful', {
        user,
        token: accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access Token via Refresh Token Rotation
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

      const { newAccessToken, newRefreshToken, user } = await tokenService.rotateSession(rawRefreshToken);

      setRefreshTokenCookie(res, newRefreshToken);

      return sendSuccess(res, 200, 'Token refreshed successfully', {
        user,
        token: newAccessToken,
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      next(error);
    }
  }

  /**
   * Logout current session
   * POST /api/auth/logout (also mounted at /api/v1/auth/logout)
   */
  async logout(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
      await tokenService.revokeSession(rawRefreshToken);

      clearRefreshTokenCookie(res);

      return sendSuccess(res, 200, 'Logged out successfully', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile
   * GET /api/auth/me (also mounted at /api/v1/auth/me)
   */
  async getMe(req, res) {
    return sendSuccess(res, 200, 'Profile retrieved successfully', req.user);
  }

  /**
   * Change user password
   * PATCH /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword({
        userId: req.user.id,
        currentPassword,
        newPassword,
      });

      clearRefreshTokenCookie(res);

      return sendSuccess(res, 200, 'Password changed successfully. All previous sessions have been revoked.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
