const { prisma } = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');
const tokenService = require('./token.service');

// Pre-computed Argon2id hash for constant-time verification when user is not found
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgqlfreSaAcw';

/**
 * Service managing core user authentication and credentials
 */
class AuthService {
  /**
   * Register a new user in the DisasterReady platform
   */
  async registerUser({ email, password, firstName, lastName, phone, role = 'CITIZEN' }) {
    // 1. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('An account with this email address is already registered.');
      error.statusCode = 409;
      error.code = 'CONFLICT';
      throw error;
    }

    // 2. Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // 3. Create user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: role || 'CITIZEN',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    // 4. Generate Access Token & Session Refresh Token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { rawRefreshToken } = await tokenService.createSession(user.id);

    return {
      user,
      accessToken,
      rawRefreshToken,
    };
  }

  /**
   * Authenticate user credentials and issue session tokens
   */
  async loginUser({ email, password }) {
    // 1. Query user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Constant-time password verification to prevent user enumeration
    const hashToVerify = user ? user.password : DUMMY_HASH;
    const isPasswordValid = await verifyPassword(hashToVerify, password);

    if (!user || !isPasswordValid) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('This user account has been deactivated.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    // 3. Generate token pair & persistent session
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { rawRefreshToken } = await tokenService.createSession(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      },
      accessToken,
      rawRefreshToken,
    };
  }

  /**
   * Change user password and invalidate all active sessions
   */
  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isCurrentValid = await verifyPassword(user.password, currentPassword);
    if (!isCurrentValid) {
      const error = new Error('Current password does not match.');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });

    // Revoke all active sessions so all devices re-authenticate with the new password
    await tokenService.revokeAllUserSessions(userId);

    return true;
  }
}

module.exports = new AuthService();
