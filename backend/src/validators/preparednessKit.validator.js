const { z } = require("zod");

/**
 * Validation schema for creating a preparedness kit item (POST /api/v1/preparedness-kit)
 */
const createItemSchema = z.object({
  name: z
    .string({ required_error: "Item name is required" })
    .trim()
    .min(1, "Item name is required")
    .max(200, "Item name must not exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable(),
  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .min(1, "Category is required")
    .max(100, "Category must not exceed 100 characters"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(10000, "Quantity must not exceed 10000")
    .default(1),
  isReady: z.coerce.boolean().default(false).optional(),
});

/**
 * Validation schema for updating a preparedness kit item (PATCH /api/v1/preparedness-kit/:id)
 */
const updateItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name cannot be empty")
    .max(200, "Item name must not exceed 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable(),
  category: z
    .string()
    .trim()
    .min(1, "Category cannot be empty")
    .max(100, "Category must not exceed 100 characters")
    .optional(),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(10000, "Quantity must not exceed 10000")
    .optional(),
  isReady: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
});

/**
 * Validation schema for updating readiness only
 * (PATCH /api/v1/preparedness-kit/:id/readiness)
 */
const updateReadinessSchema = z.object({
  isReady: z.coerce.boolean({ required_error: "isReady is required" }),
});

/**
 * Validation schema for query parameters on GET /api/v1/preparedness-kit
 */
const queryKitSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(20),
  category: z
    .string()
    .trim()
    .max(100, "Category must not exceed 100 characters")
    .optional(),
  isReady: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  sortBy: z
    .enum(
      ["name", "category", "isReady", "quantity", "createdAt", "updatedAt"],
      {
        errorMap: () => ({
          message:
            "sortBy must be one of: name, category, isReady, quantity, createdAt, updatedAt",
        }),
      },
    )
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "sortOrder must be asc or desc" }),
    })
    .default("asc"),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  updateReadinessSchema,
  queryKitSchema,
};
