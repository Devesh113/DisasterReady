const eventService = require("../services/event.service");
const { sendSuccess } = require("../utils/response");

/**
 * Event Controller
 * Handles HTTP requests for /api/v1/events
 */
class EventController {
  /**
   * GET /api/v1/events
   * Public: list events with filtering and pagination
   */
  async list(req, res, next) {
    try {
      const result = await eventService.listEvents(
        req.validatedQuery || req.query,
      );
      return sendSuccess(res, 200, "Events retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/:id
   * Public: get single event details
   */
  async getById(req, res, next) {
    try {
      const event = await eventService.getEventById(req.params.id);
      return sendSuccess(res, 200, "Event retrieved successfully", { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events
   * Protected: AUTHORITY, ADMIN
   */
  async create(req, res, next) {
    try {
      const event = await eventService.createEvent(req.body, req.user);
      return sendSuccess(res, 201, "Event created successfully", { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/events/:id
   * Protected: Organizer (AUTHORITY) or ADMIN
   */
  async update(req, res, next) {
    try {
      const event = await eventService.updateEvent(
        req.params.id,
        req.body,
        req.user,
      );
      return sendSuccess(res, 200, "Event updated successfully", { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/events/:id
   * Protected: ADMIN only
   */
  async delete(req, res, next) {
    try {
      const result = await eventService.deleteEvent(req.params.id, req.user);
      return sendSuccess(res, 200, "Event deleted successfully", result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
