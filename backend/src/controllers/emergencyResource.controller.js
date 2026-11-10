const emergencyResourceService = require("../services/emergencyResource.service");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * Emergency Resource Controller
 * Handles HTTP request/response cycle for /api/v1/emergency-resources
 */

class EmergencyResourceController {
  /**
   * GET /api/v1/emergency-resources
   * List emergency resources with optional filters and pagination
   * Public: sees only active resources
   * ADMIN/AUTHORITY: can filter by isActive
   */
  async list(req, res, next) {
    try {
      const result = await emergencyResourceService.listResources(
        req.validatedQuery || req.query,
        req.user || null,
      );
      return sendSuccess(
        res,
        200,
        "Emergency resources retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/emergency-resources/:id
   * Get a single emergency resource by ID
   * Public: only active; ADMIN/AUTHORITY: any
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await emergencyResourceService.getResourceById(
        id,
        req.user || null,
      );
      return sendSuccess(
        res,
        200,
        "Emergency resource retrieved successfully",
        { resource },
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/emergency-resources
   * Create a new emergency resource
   * Requires ADMIN or AUTHORITY role
   */
  async create(req, res, next) {
    try {
      const resource = await emergencyResourceService.createResource(
        req.body,
        req.user,
      );
      return sendSuccess(res, 201, "Emergency resource created successfully", {
        resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/emergency-resources/:id
   * Partially update an emergency resource
   * Requires ADMIN or AUTHORITY role
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await emergencyResourceService.updateResource(
        id,
        req.body,
        req.user,
      );
      return sendSuccess(res, 200, "Emergency resource updated successfully", {
        resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/emergency-resources/:id
   * Deactivate (soft-delete) or permanently delete an emergency resource
   * Requires ADMIN or AUTHORITY role
   * Query param ?hard=true performs hard delete (ADMIN only)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const hardDelete = req.query.hard === "true";
      const result = await emergencyResourceService.deleteResource(
        id,
        req.user,
        hardDelete,
      );
      return sendSuccess(
        res,
        200,
        "Emergency resource deactivated successfully",
        { resource: result },
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmergencyResourceController();
