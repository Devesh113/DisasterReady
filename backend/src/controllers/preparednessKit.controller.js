const preparednessKitService = require("../services/preparednessKit.service");
const { sendSuccess } = require("../utils/response");

/**
 * Preparedness Kit Controller
 * All routes require authentication — user identity comes from req.user.id exclusively.
 */

class PreparednessKitController {
  /**
   * GET /api/v1/preparedness-kit
   * List the authenticated user's kit items (paginated, filtered)
   */
  async list(req, res, next) {
    try {
      const result = await preparednessKitService.listItems(
        req.user.id,
        req.validatedQuery || req.query,
      );
      return sendSuccess(
        res,
        200,
        "Preparedness kit retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/preparedness-kit
   * Add an item to the authenticated user's kit
   */
  async create(req, res, next) {
    try {
      const item = await preparednessKitService.createItem(
        req.body,
        req.user.id,
      );
      return sendSuccess(res, 201, "Preparedness item added successfully", {
        item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/preparedness-kit/:id
   * Get a specific item (ownership enforced)
   */
  async getById(req, res, next) {
    try {
      const item = await preparednessKitService.getItemById(
        req.params.id,
        req.user.id,
      );
      return sendSuccess(res, 200, "Preparedness item retrieved successfully", {
        item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/preparedness-kit/:id
   * Update item details (ownership enforced)
   */
  async update(req, res, next) {
    try {
      const item = await preparednessKitService.updateItem(
        req.params.id,
        req.body,
        req.user.id,
      );
      return sendSuccess(res, 200, "Preparedness item updated successfully", {
        item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/preparedness-kit/:id/readiness
   * Update only the readiness status of an item (ownership enforced)
   */
  async updateReadiness(req, res, next) {
    try {
      const item = await preparednessKitService.updateReadiness(
        req.params.id,
        req.body.isReady,
        req.user.id,
      );
      return sendSuccess(res, 200, "Item readiness updated successfully", {
        item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/preparedness-kit/:id
   * Remove an item from the kit (ownership enforced)
   */
  async delete(req, res, next) {
    try {
      const result = await preparednessKitService.deleteItem(
        req.params.id,
        req.user.id,
      );
      return sendSuccess(
        res,
        200,
        "Preparedness item removed successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/preparedness-kit/stats
   * Get readiness statistics for the authenticated user's kit
   */
  async stats(req, res, next) {
    try {
      const stats = await preparednessKitService.getStats(req.user.id);
      return sendSuccess(
        res,
        200,
        "Preparedness kit statistics retrieved successfully",
        { stats },
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PreparednessKitController();
