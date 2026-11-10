const express = require('express');
const router = express.Router();

const emergencyResourceController = require('../controllers/emergencyResource.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateQuery } = require('../middleware/validate');
const {
  createResourceSchema,
  updateResourceSchema,
  queryResourceSchema,
} = require('../validators/emergencyResource.validator');

// Middleware that optionally authenticates without rejecting unauthenticated requests
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // unauthenticated — proceed, req.user stays undefined
  }
  return authenticate(req, res, next);
};

// ============================================================
// Public Routes (unauthenticated access allowed for GET)
// ============================================================

// GET /api/v1/emergency-resources — list resources (public sees only active)
router.get(
  '/',
  optionalAuth,
  validateQuery(queryResourceSchema),
  emergencyResourceController.list
);

// GET /api/v1/emergency-resources/:id — get single resource
router.get('/:id', optionalAuth, emergencyResourceController.getById);

// ============================================================
// Protected Routes (ADMIN or AUTHORITY required)
// ============================================================

// POST /api/v1/emergency-resources — create a resource
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'AUTHORITY'),
  validate(createResourceSchema),
  emergencyResourceController.create
);

// PATCH /api/v1/emergency-resources/:id — update a resource
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'AUTHORITY'),
  validate(updateResourceSchema),
  emergencyResourceController.update
);

// DELETE /api/v1/emergency-resources/:id — deactivate or delete
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'AUTHORITY'),
  emergencyResourceController.delete
);

module.exports = router;
