const express = require('express');
const disasterController = require('../controllers/disaster.controller');
const validate = require('../middleware/validate');
const { validateQuery } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createDisasterSchema,
  updateDisasterSchema,
  queryDisasterSchema,
} = require('../validators/disaster.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/disasters (also /api/disasters)
 * @desc    List all disaster types with pagination, type filtering, and search
 * @access  Public
 */
router.get('/', validateQuery(queryDisasterSchema), disasterController.getAll);

/**
 * @route   GET /api/v1/disasters/:id (also /api/disasters/:id)
 * @desc    Retrieve a single disaster by UUID
 * @access  Public
 */
router.get('/:id', disasterController.getById);

/**
 * @route   POST /api/v1/disasters (also /api/disasters)
 * @desc    Create a new disaster type entry
 * @access  Private (ADMIN only)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createDisasterSchema),
  disasterController.create
);

/**
 * @route   PATCH /api/v1/disasters/:id (also /api/disasters/:id)
 * @desc    Update an existing disaster entry
 * @access  Private (ADMIN only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateDisasterSchema),
  disasterController.update
);

/**
 * @route   DELETE /api/v1/disasters/:id (also /api/disasters/:id)
 * @desc    Delete a disaster entry
 * @access  Private (ADMIN only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  disasterController.remove
);

module.exports = router;
