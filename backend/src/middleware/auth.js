const { verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../config/db');
const { sendError } = require('../utils/response');

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        401,
        'Authentication required. Please provide a Bearer access token in the Authorization header.',
        'AUTHENTICATION_REQUIRED'
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(
          res,
          401,
          'Access token has expired. Please refresh your session.',
          'TOKEN_EXPIRED'
        );
      }
      return sendError(
        res,
        401,
        'Invalid access token. Signature verification failed.',
        'INVALID_TOKEN'
      );
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(
        res,
        401,
        'The user associated with this token no longer exists.',
        'USER_NOT_FOUND'
      );
    }

    if (!user.isActive) {
      return sendError(
        res,
        403,
        'This user account has been deactivated. Please contact an administrator.',
        'ACCOUNT_DEACTIVATED'
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles - UserRole enum values (e.g., 'ADMIN', 'AUTHORITY', 'CITIZEN')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        401,
        'Authentication required prior to authorization check.',
        'AUTHENTICATION_REQUIRED'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
        'FORBIDDEN'
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
