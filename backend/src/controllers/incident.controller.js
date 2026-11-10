const incidentService = require('../services/incident.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller handling Incident Reporting endpoints.
 */
class IncidentController {
  /**
   * Submit an incident report
   * POST /api/v1/incidents (or /api/v1/incident-reports)
   */
  async create(req, res, next) {
    try {
      const report = await incidentService.createIncident(req.body, req.user);
      return sendSuccess(res, 201, 'Incident report submitted successfully', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all incident reports (AUTHORITY, ADMIN)
   * GET /api/v1/incidents (or /api/v1/incident-reports)
   */
  async getAll(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await incidentService.getAllIncidents({
        page: query.page,
        limit: query.limit,
        status: query.status,
        search: query.search,
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius,
        radiusKm: query.radiusKm,
        reportedById: query.reportedById,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the authenticated user's submitted incident reports
   * GET /api/v1/users/me/incident-reports (or /api/v1/users/me/incidents)
   */
  async getMyIncidents(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await incidentService.getUserIncidents(req.user.id, {
        page: query.page,
        limit: query.limit,
        status: query.status,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single incident report by ID
   * GET /api/v1/incidents/:id (or /api/v1/incident-reports/:id)
   */
  async getById(req, res, next) {
    try {
      const report = await incidentService.getIncidentById(req.params.id, req.user);
      return sendSuccess(res, 200, 'Incident report retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an incident report (status transition or content update)
   * PATCH /api/v1/incidents/:id (or /api/v1/incident-reports/:id)
   */
  async update(req, res, next) {
    try {
      const report = await incidentService.updateIncident(req.params.id, req.body, req.user);
      return sendSuccess(res, 200, 'Incident report updated successfully', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an incident report (ADMIN only)
   * DELETE /api/v1/incidents/:id (or /api/v1/incident-reports/:id)
   */
  async remove(req, res, next) {
    try {
      await incidentService.deleteIncident(req.params.id, req.user);
      return sendSuccess(res, 200, 'Incident report deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IncidentController();

