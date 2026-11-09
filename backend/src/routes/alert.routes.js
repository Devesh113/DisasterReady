const express = require('express');
const alertController = require('../controllers/alert.controller');
const validate = require('../middleware/validate');
const { validateQuery } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createAlertSchema,
  updateAlertSchema,
  queryAlertSchema,
} = require('../validators/alert.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/alerts (also /api/alerts)
 * @desc    List alerts with pagination, status, severity, disasterType, search, and geo-filtering
 * @access  Public
 */
router.get('/', validateQuery(queryAlertSchema), alertController.getAll);

/**
 * @route   GET /api/v1/alerts/:id (also /api/alerts/:id)
 * @desc    Retrieve single alert details by UUID
 * @access  Public
 */
router.get('/:id', alertController.getById);

/**
 * @route   POST /api/v1/alerts (also /api/alerts)
 * @desc    Create an emergency alert
 * @access  Private (AUTHORITY, ADMIN)
 */
router.post(
  '/',
  authenticate,
  authorize('AUTHORITY', 'ADMIN'),
  validate(createAlertSchema),
  alertController.create
);

/**
 * @route   PATCH /api/v1/alerts/:id (also /api/alerts/:id)
 * @desc    Update alert status, description, or parameters
 * @access  Private (AUTHORITY [creator only], ADMIN)
 */
router.patch(
  '/:id',
  authenticate,
  authorize('AUTHORITY', 'ADMIN'),
  validate(updateAlertSchema),
  alertController.update
);

/**
 * @route   DELETE /api/v1/alerts/:id (also /api/alerts/:id)
 * @desc    Permanently delete an alert
 * @access  Private (ADMIN only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  alertController.remove
);

module.exports = router;

