const { prisma } = require('../config/db');
const { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } = require('../utils/jwt');
const { hashToken } = require('../utils/password');

/**
 * Service managing database-backed Refresh Tokens and Session Lifecycle
 */
class TokenService {
  /**
   * Create a new persistent session with a hashed refresh token
   * @param {string} userId
   * @returns {Promise<{ rawRefreshToken: string, session: Object }>}
   */
  async createSession(userId) {
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = getRefreshTokenExpiry();

    const session = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });

    return { rawRefreshToken, session };
  }

  /**
   * Rotate a Refresh Token (Detects token reuse, revokes old session, issues new token pair)
   * @param {string} rawRefreshToken
   * @returns {Promise<{ newAccessToken: string, newRefreshToken: string, user: Object }>}
   */
  async rotateSession(rawRefreshToken) {
    if (!rawRefreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 401;
      error.code = 'REFRESH_TOKEN_REQUIRED';
      throw error;
    }

    const refreshTokenHash = hashToken(rawRefreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // 1. Session does not exist
    if (!session) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // 2. Token Reuse Detection: Session was already revoked!
    // Indicates that an old, rotated token has been intercepted or replayed by an attacker.
    if (session.revokedAt) {
      console.warn(`[Security Alert] Refresh token reuse detected for user ${session.userId}. Revoking all sessions.`);
      await prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      const error = new Error('Token reuse detected. All active sessions have been revoked for your security.');
      error.statusCode = 401;
      error.code = 'TOKEN_REUSE_DETECTED';
      throw error;
    }

    // 3. User account deactivated
    if (!session.user || !session.user.isActive) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      const error = new Error('Account deactivated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    // 4. Token expired
    if (new Date() > new Date(session.expiresAt)) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      const error = new Error('Refresh token has expired. Please log in again.');
      error.statusCode = 401;
      error.code = 'REFRESH_TOKEN_EXPIRED';
      throw error;
    }

    // 5. Valid session -> Atomically rotate token pair
    const newRawRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = getRefreshTokenExpiry();

    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      prisma.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return {
      newAccessToken,
      newRefreshToken: newRawRefreshToken,
      user: session.user,
    };
  }

  /**
   * Revoke a single session
   * @param {string} rawRefreshToken
   */
  async revokeSession(rawRefreshToken) {
    if (!rawRefreshToken) return;

    const refreshTokenHash = hashToken(rawRefreshToken);
    try {
      await prisma.session.update({
        where: { refreshTokenHash },
        data: { revokedAt: new Date() },
      });
    } catch (err) {
      // Ignore if session not found
    }
  }

  /**
   * Revoke all sessions for a user (used upon password change or global logout)
   * @param {string} userId
   */
  async revokeAllUserSessions(userId) {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}

module.exports = new TokenService();
