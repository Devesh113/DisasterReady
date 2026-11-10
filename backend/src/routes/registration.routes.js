const express = require("express");
const router = express.Router();

const registrationController = require("../controllers/registration.controller");
const { authenticate } = require("../middleware/auth");
const { validateQuery } = require("../middleware/validate");
const {
  queryRegistrationSchema,
} = require("../validators/registration.validator");

// All registration routes require authentication
router.use(authenticate);

// GET /api/v1/registrations — list the authenticated user's registrations
router.get(
  "/",
  validateQuery(queryRegistrationSchema),
  registrationController.getMyRegistrations,
);

// GET /api/v1/registrations/:id — get registration details
router.get("/:id", registrationController.getById);

// DELETE /api/v1/registrations/:id — cancel registration
router.delete("/:id", registrationController.cancelById);

module.exports = router;
