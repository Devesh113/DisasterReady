const alertService = require('../services/alert.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller handling Emergency Alert Management endpoints.
 */
class AlertController {
  /**
   * Create an emergency alert
   * POST /api/v1/alerts
   */
  async create(req, res, next) {
    try {
      const alert = await alertService.createAlert(req.body, req.user);
      return sendSuccess(res, 201, 'Alert created successfully', alert);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all alerts with pagination, multi-attribute filtering, and proximity search
   * GET /api/v1/alerts
   */
  async getAll(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await alertService.getAllAlerts({
        page: query.page,
        limit: query.limit,
        severity: query.severity,
        status: query.status,
        disasterId: query.disasterId,
        disasterType: query.disasterType,
        search: query.search,
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius,
        radiusKm: query.radiusKm,
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
   * Get alert details by ID
   * GET /api/v1/alerts/:id
   */
  async getById(req, res, next) {
    try {
      const alert = await alertService.getAlertById(req.params.id);
      return sendSuccess(res, 200, 'Alert retrieved successfully', alert);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing alert
   * PATCH /api/v1/alerts/:id
   */
  async update(req, res, next) {
    try {
      const alert = await alertService.updateAlert(req.params.id, req.body, req.user);
      return sendSuccess(res, 200, 'Alert updated successfully', alert);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an alert (ADMIN only)
   * DELETE /api/v1/alerts/:id
   */
  async remove(req, res, next) {
    try {
      await alertService.deleteAlert(req.params.id, req.user);
      return sendSuccess(res, 200, 'Alert deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertController();

