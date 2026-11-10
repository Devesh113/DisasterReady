const express = require("express");
const router = express.Router();

const eventController = require("../controllers/event.controller");
const registrationController = require("../controllers/registration.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { validateQuery } = require("../middleware/validate");
const {
  createEventSchema,
  updateEventSchema,
  queryEventSchema,
} = require("../validators/event.validator");
const {
  queryRegistrationSchema,
} = require("../validators/registration.validator");

// ============================================================
// Public Event Routes
// ============================================================

// GET /api/v1/events — list events
router.get("/", validateQuery(queryEventSchema), eventController.list);

// GET /api/v1/events/:id — get event details
router.get("/:id", eventController.getById);

// ============================================================
// Protected Event Management Routes
// ============================================================

// POST /api/v1/events — create an event (AUTHORITY, ADMIN)
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "AUTHORITY"),
  validate(createEventSchema),
  eventController.create,
);

// PATCH /api/v1/events/:id — update an event (Organizer or ADMIN)
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "AUTHORITY"),
  validate(updateEventSchema),
  eventController.update,
);

// DELETE /api/v1/events/:id — delete an event (ADMIN)
router.delete("/:id", authenticate, authorize("ADMIN"), eventController.delete);

// ============================================================
// Event Registration Routes (Nested under /api/v1/events)
// ============================================================

// POST /api/v1/events/:id/register (and :eventId/register) — register for event
router.post("/:id/register", authenticate, registrationController.register);

// DELETE /api/v1/events/:id/register (and :eventId/register) — cancel registration
router.delete("/:id/register", authenticate, registrationController.cancel);

// GET /api/v1/events/:id/registrations — list attendees (Organizer or ADMIN)
router.get(
  "/:id/registrations",
  authenticate,
  authorize("ADMIN", "AUTHORITY"),
  validateQuery(queryRegistrationSchema),
  registrationController.getEventAttendees,
);

module.exports = router;
