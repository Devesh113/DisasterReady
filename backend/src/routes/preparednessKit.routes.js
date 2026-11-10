const express = require("express");
const router = express.Router();

const preparednessKitController = require("../controllers/preparednessKit.controller");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { validateQuery } = require("../middleware/validate");
const {
  createItemSchema,
  updateItemSchema,
  updateReadinessSchema,
  queryKitSchema,
} = require("../validators/preparednessKit.validator");

// All preparedness kit routes require authentication
router.use(authenticate);

// GET /api/v1/preparedness-kit/stats — MUST be before /:id to avoid conflict
router.get("/stats", preparednessKitController.stats);

// GET /api/v1/preparedness-kit — list user's items
router.get("/", validateQuery(queryKitSchema), preparednessKitController.list);

// POST /api/v1/preparedness-kit — add an item
router.post("/", validate(createItemSchema), preparednessKitController.create);

// GET /api/v1/preparedness-kit/:id — get specific item
router.get("/:id", preparednessKitController.getById);

// PATCH /api/v1/preparedness-kit/:id — update item details
router.patch(
  "/:id",
  validate(updateItemSchema),
  preparednessKitController.update,
);

// PATCH /api/v1/preparedness-kit/:id/readiness — update readiness only
router.patch(
  "/:id/readiness",
  validate(updateReadinessSchema),
  preparednessKitController.updateReadiness,
);

// DELETE /api/v1/preparedness-kit/:id — remove item
router.delete("/:id", preparednessKitController.delete);

module.exports = router;
