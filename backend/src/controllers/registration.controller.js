const registrationService = require("../services/registration.service");
const { sendSuccess } = require("../utils/response");

/**
 * Registration Controller
 * Handles HTTP requests for event registrations and attendee lists
 */
class RegistrationController {
  /**
   * POST /api/v1/events/:eventId/register
   * Authenticated: Register current user for event
   */
  async register(req, res, next) {
    try {
      const eventId = req.params.eventId || req.params.id;
      const registration = await registrationService.registerForEvent(
        eventId,
        req.user.id,
      );
      return sendSuccess(res, 201, "Successfully registered for event", {
        registration,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/events/:eventId/register
   * Authenticated: Cancel current user's registration for event
   */
  async cancel(req, res, next) {
    try {
      const eventId = req.params.eventId || req.params.id;
      await registrationService.cancelRegistration(eventId, req.user.id);
      return sendSuccess(res, 200, "Registration cancelled successfully", null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/:eventId/registrations
   * Protected: Organizer (AUTHORITY) or ADMIN
   * List attendees for a specific event
   */
  async getEventAttendees(req, res, next) {
    try {
      const eventId = req.params.eventId || req.params.id;
      const result = await registrationService.getEventRegistrations(
        eventId,
        req.validatedQuery || req.query,
        req.user,
      );
      return sendSuccess(
        res,
        200,
        "Event registrations retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/registrations
   * Also GET /api/v1/registrations
   * Authenticated: Get current user's registrations
   */
  async getMyRegistrations(req, res, next) {
    try {
      const result = await registrationService.getUserRegistrations(
        req.user.id,
        req.validatedQuery || req.query,
      );
      return sendSuccess(
        res,
        200,
        "User registrations retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/registrations/:id
   * Authenticated: Get single registration details
   */
  async getById(req, res, next) {
    try {
      const registration = await registrationService.getRegistrationById(
        req.params.id,
        req.user,
      );
      return sendSuccess(res, 200, "Registration retrieved successfully", {
        registration,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/registrations/:id
   * Authenticated: Cancel registration by registration ID
   */
  async cancelById(req, res, next) {
    try {
      await registrationService.cancelRegistrationById(
        req.params.id,
        req.user.id,
      );
      return sendSuccess(res, 200, "Registration cancelled successfully", null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistrationController();
