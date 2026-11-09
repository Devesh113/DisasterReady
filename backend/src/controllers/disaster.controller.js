const disasterService = require('../services/disaster.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller handling Disaster Management endpoints for DisasterReady
 */
class DisasterController {
  /**
   * Create a new disaster entry
   * POST /api/v1/disasters
   */
  async create(req, res, next) {
    try {
      const disaster = await disasterService.createDisaster(req.body);
      return sendSuccess(res, 201, 'Disaster created successfully', disaster);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all disasters with pagination, filtering, and search
   * GET /api/v1/disasters
   */
  async getAll(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await disasterService.getAllDisasters({
        page: query.page,
        limit: query.limit,
        type: query.type,
        search: query.search,
      });

      // Return paginated response matching API_CONTRACTS.md format
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
   * Retrieve a single disaster by ID
   * GET /api/v1/disasters/:id
   */
  async getById(req, res, next) {
    try {
      const disaster = await disasterService.getDisasterById(req.params.id);
      return sendSuccess(res, 200, 'Disaster retrieved successfully', disaster);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing disaster entry
   * PATCH /api/v1/disasters/:id
   */
  async update(req, res, next) {
    try {
      const disaster = await disasterService.updateDisaster(req.params.id, req.body);
      return sendSuccess(res, 200, 'Disaster updated successfully', disaster);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a disaster entry
   * DELETE /api/v1/disasters/:id
   */
  async remove(req, res, next) {
    try {
      await disasterService.deleteDisaster(req.params.id);
      return sendSuccess(res, 200, 'Disaster deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DisasterController();

