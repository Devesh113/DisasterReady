const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");

/**
 * Preparedness Kit Service
 * Strictly user-scoped — all operations derive ownership from req.user.id.
 * Never trust userId from the request body.
 */

/**
 * List the authenticated user's preparedness items
 * @param {string} userId - Authenticated user's ID (from req.user.id)
 * @param {object} query - Validated query parameters
 * @returns {object} Paginated list + readiness stats
 */
const listItems = async (userId, query) => {
  const {
    page = 1,
    limit = 20,
    category,
    isReady,
    sortBy = "createdAt",
    sortOrder = "asc",
  } = query;

  const whereClause = { userId };

  if (category) {
    whereClause.category = { contains: category.trim(), mode: "insensitive" };
  }

  if (typeof isReady === "boolean") {
    whereClause.isReady = isReady;
  }

  const skip = (page - 1) * limit;

  const [total, items, totalItems, readyItems] = await Promise.all([
    prisma.preparednessItem.count({ where: whereClause }),
    prisma.preparednessItem.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    // Stats — total items for this user (regardless of filters)
    prisma.preparednessItem.count({ where: { userId } }),
    prisma.preparednessItem.count({ where: { userId, isReady: true } }),
  ]);

  const readinessPercentage =
    totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0;

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    stats: {
      totalItems,
      readyItems,
      notReadyItems: totalItems - readyItems,
      readinessPercentage,
    },
  };
};

/**
 * Get a single preparedness item — enforces ownership
 * @param {string} itemId - Item UUID
 * @param {string} userId - Authenticated user's ID
 * @returns {object} Item
 */
const getItemById = async (itemId, userId) => {
  const item = await prisma.preparednessItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new ApiError(404, "Preparedness item not found.", "ITEM_NOT_FOUND");
  }

  return item;
};

/**
 * Add a new item to the user's preparedness kit
 * @param {object} data - Validated item data
 * @param {string} userId - Authenticated user's ID (from req.user.id)
 * @returns {object} Created item
 */
const createItem = async (data, userId) => {
  const item = await prisma.preparednessItem.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      quantity: data.quantity ?? 1,
      isReady: data.isReady ?? false,
      userId,
    },
  });

  return item;
};

/**
 * Update an item — enforces ownership via userId
 * @param {string} itemId - Item UUID
 * @param {object} data - Validated update data
 * @param {string} userId - Authenticated user's ID
 * @returns {object} Updated item
 */
const updateItem = async (itemId, data, userId) => {
  // Ownership check
  const existing = await prisma.preparednessItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!existing) {
    throw new ApiError(404, "Preparedness item not found.", "ITEM_NOT_FOUND");
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.isReady !== undefined) updateData.isReady = data.isReady;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(
      400,
      "No valid fields provided for update.",
      "NO_UPDATE_FIELDS",
    );
  }

  const item = await prisma.preparednessItem.update({
    where: { id: itemId },
    data: updateData,
  });

  return item;
};

/**
 * Update only the readiness of an item — enforces ownership
 * @param {string} itemId - Item UUID
 * @param {boolean} isReady - New readiness value
 * @param {string} userId - Authenticated user's ID
 * @returns {object} Updated item
 */
const updateReadiness = async (itemId, isReady, userId) => {
  const existing = await prisma.preparednessItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!existing) {
    throw new ApiError(404, "Preparedness item not found.", "ITEM_NOT_FOUND");
  }

  const item = await prisma.preparednessItem.update({
    where: { id: itemId },
    data: { isReady },
  });

  return item;
};

/**
 * Delete an item from the user's preparedness kit — enforces ownership
 * @param {string} itemId - Item UUID
 * @param {string} userId - Authenticated user's ID
 * @returns {object} Deletion result
 */
const deleteItem = async (itemId, userId) => {
  const existing = await prisma.preparednessItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!existing) {
    throw new ApiError(404, "Preparedness item not found.", "ITEM_NOT_FOUND");
  }

  await prisma.preparednessItem.delete({ where: { id: itemId } });

  return { id: itemId, deleted: true };
};

/**
 * Get readiness summary stats for a user
 * @param {string} userId
 * @returns {object} Stats
 */
const getStats = async (userId) => {
  const [totalItems, readyItems] = await Promise.all([
    prisma.preparednessItem.count({ where: { userId } }),
    prisma.preparednessItem.count({ where: { userId, isReady: true } }),
  ]);

  // Category breakdown
  const categoryGroups = await prisma.preparednessItem.groupBy({
    by: ["category"],
    where: { userId },
    _count: { id: true },
  });

  const categories = categoryGroups.map((g) => ({
    category: g.category,
    count: g._count.id,
  }));

  return {
    totalItems,
    readyItems,
    notReadyItems: totalItems - readyItems,
    readinessPercentage:
      totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0,
    categories,
  };
};

module.exports = {
  listItems,
  getItemById,
  createItem,
  updateItem,
  updateReadiness,
  deleteItem,
  getStats,
};
