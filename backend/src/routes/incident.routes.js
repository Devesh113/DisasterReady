const express = require('express');
const incidentController = require('../controllers/incident.controller');
const validate = require('../middleware/validate');
const { validateQuery } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createIncidentSchema,
  updateIncidentSchema,
  queryIncidentSchema,
} = require('../validators/incident.validator');

const router = express.Router();

/**
 * @route   POST /api/v1/incidents (or /api/v1/incident-reports)
 * @desc    Submit a new localized incident report
 * @access  Private (Authenticated users: CITIZEN, AUTHORITY, ADMIN)
 */
router.post(
  '/',
  authenticate,
  validate(createIncidentSchema),
  incidentController.create
);

/**
 * @route   GET /api/v1/incidents (or /api/v1/incident-reports)
 * @desc    List all submitted incident reports with filters and proximity
 * @access  Private (AUTHORITY, ADMIN only per API_CONTRACTS.md)
 */
router.get(
  '/',
  authenticate,
  authorize('AUTHORITY', 'ADMIN'),
  validateQuery(queryIncidentSchema),
  incidentController.getAll
);

/**
 * @route   GET /api/v1/incidents/me (and /api/v1/users/me/incident-reports)
 * @desc    Get the current user's submitted incident reports
 * @access  Private (Authenticated)
 */
router.get(
  '/me',
  authenticate,
  validateQuery(queryIncidentSchema),
  incidentController.getMyIncidents
);

/**
 * @route   GET /api/v1/incidents/:id (or /api/v1/incident-reports/:id)
 * @desc    Get detailed incident report information
 * @access  Private (AUTHORITY, ADMIN, or the submitting citizen)
 */
router.get(
  '/:id',
  authenticate,
  incidentController.getById
);

/**
 * @route   PATCH /api/v1/incidents/:id (or /api/v1/incident-reports/:id)
 * @desc    Update report status (AUTHORITY/ADMIN) or edit pending report (CITIZEN owner)
 * @access  Private (Authenticated)
 */
router.patch(
  '/:id',
  authenticate,
  validate(updateIncidentSchema),
  incidentController.update
);

/**
 * @route   DELETE /api/v1/incidents/:id (or /api/v1/incident-reports/:id)
 * @desc    Permanently delete an incident report
 * @access  Private (ADMIN only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  incidentController.remove
);

module.exports = router;

