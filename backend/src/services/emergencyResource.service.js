const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const {
  getBoundingBox,
  calculateHaversineDistance,
  isValidCoordinates,
  isValidRadius,
} = require("../utils/geo");

/**
 * Emergency Resource Service
 * Handles all business logic for emergency resource management.
 * EmergencyResource model has no user relation — resources are managed by ADMIN/AUTHORITY.
 */

/**
 * List emergency resources with filtering, pagination, geographic search
 * @param {object} query - Validated query parameters
 * @param {object|null} requestingUser - Authenticated user (null = public)
 * @returns {object} Paginated resource list
 */
const listResources = async (query, requestingUser = null) => {
  const {
    page = 1,
    limit = 10,
    type,
    isActive,
    search,
    latitude,
    longitude,
    radiusKm,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  // Public users can only see active resources
  const isAdmin =
    requestingUser && ["ADMIN", "AUTHORITY"].includes(requestingUser.role);

  const whereClause = {};

  // Active filter — public always gets only active; admins can filter
  if (!isAdmin) {
    whereClause.isActive = true;
  } else if (typeof isActive === "boolean") {
    whereClause.isActive = isActive;
  }

  // Type filter
  if (type) {
    whereClause.type = type;
  }

  // Keyword search on name, description, address
  if (search) {
    const term = search.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { address: { contains: term, mode: "insensitive" } },
    ];
  }

  // Geographic bounding box pre-filter
  let geoBounds = null;
  if (latitude !== undefined && longitude !== undefined) {
    if (!isValidCoordinates(latitude, longitude)) {
      throw new ApiError(
        400,
        "Invalid coordinates provided.",
        "INVALID_COORDINATES",
      );
    }
    const radius = radiusKm || 50; // default 50 km if coords but no radius
    if (!isValidRadius(radius)) {
      throw new ApiError(400, "Invalid radius provided.", "INVALID_RADIUS");
    }
    geoBounds = getBoundingBox(latitude, longitude, radius);
    whereClause.latitude = { gte: geoBounds.minLat, lte: geoBounds.maxLat };
    whereClause.longitude = { gte: geoBounds.minLon, lte: geoBounds.maxLon };
  }

  const skip = (page - 1) * limit;

  const [total, rawResources] = await Promise.all([
    prisma.emergencyResource.count({ where: whereClause }),
    prisma.emergencyResource.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  // If geographic filter was applied, further refine with Haversine and annotate distance
  let resources = rawResources;
  if (geoBounds && latitude !== undefined && longitude !== undefined) {
    const radius = radiusKm || 50;
    resources = rawResources
      .map((r) => {
        const dist = calculateHaversineDistance(
          latitude,
          longitude,
          r.latitude,
          r.longitude,
        );
        return { ...r, distanceKm: Math.round(dist * 100) / 100 };
      })
      .filter((r) => r.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return {
    resources,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get a single emergency resource by ID
 * @param {string} id - Resource UUID
 * @param {object|null} requestingUser - Authenticated user
 * @returns {object} Resource
 */
const getResourceById = async (id, requestingUser = null) => {
  const resource = await prisma.emergencyResource.findUnique({ where: { id } });

  if (!resource) {
    throw new ApiError(
      404,
      "Emergency resource not found.",
      "RESOURCE_NOT_FOUND",
    );
  }

  const isAdmin =
    requestingUser && ["ADMIN", "AUTHORITY"].includes(requestingUser.role);

  // Public can only see active resources
  if (!resource.isActive && !isAdmin) {
    throw new ApiError(
      404,
      "Emergency resource not found.",
      "RESOURCE_NOT_FOUND",
    );
  }

  return resource;
};

/**
 * Create a new emergency resource
 * @param {object} data - Validated resource data
 * @param {object} requestingUser - Authenticated user (ADMIN or AUTHORITY)
 * @returns {object} Created resource
 */
const createResource = async (data, requestingUser) => {
  if (!["ADMIN", "AUTHORITY"].includes(requestingUser.role)) {
    throw new ApiError(
      403,
      "Only ADMIN or AUTHORITY users can create emergency resources.",
      "FORBIDDEN",
    );
  }

  const resource = await prisma.emergencyResource.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description ?? null,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone ?? null,
      capacity: data.capacity ?? null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  return resource;
};

/**
 * Update an existing emergency resource (partial update)
 * @param {string} id - Resource UUID
 * @param {object} data - Validated update data
 * @param {object} requestingUser - Authenticated user
 * @returns {object} Updated resource
 */
const updateResource = async (id, data, requestingUser) => {
  if (!["ADMIN", "AUTHORITY"].includes(requestingUser.role)) {
    throw new ApiError(
      403,
      "Only ADMIN or AUTHORITY users can update emergency resources.",
      "FORBIDDEN",
    );
  }

  const existing = await prisma.emergencyResource.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(
      404,
      "Emergency resource not found.",
      "RESOURCE_NOT_FOUND",
    );
  }

  // Build update payload — only include explicitly provided fields
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(
      400,
      "No valid fields provided for update.",
      "NO_UPDATE_FIELDS",
    );
  }

  const resource = await prisma.emergencyResource.update({
    where: { id },
    data: updateData,
  });

  return resource;
};

/**
 * Delete (or deactivate) an emergency resource
 * Uses soft-delete (isActive = false) to preserve data integrity
 * @param {string} id - Resource UUID
 * @param {object} requestingUser - Authenticated user
 * @param {boolean} hardDelete - If true, permanently delete (ADMIN only)
 * @returns {object} Deactivated/deleted resource
 */
const deleteResource = async (id, requestingUser, hardDelete = false) => {
  if (!["ADMIN", "AUTHORITY"].includes(requestingUser.role)) {
    throw new ApiError(
      403,
      "Only ADMIN or AUTHORITY users can delete emergency resources.",
      "FORBIDDEN",
    );
  }

  const existing = await prisma.emergencyResource.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(
      404,
      "Emergency resource not found.",
      "RESOURCE_NOT_FOUND",
    );
  }

  // Hard delete only for ADMIN
  if (hardDelete && requestingUser.role === "ADMIN") {
    await prisma.emergencyResource.delete({ where: { id } });
    return { id, deleted: true };
  }

  // Default: soft-delete (deactivate)
  const resource = await prisma.emergencyResource.update({
    where: { id },
    data: { isActive: false },
  });

  return resource;
};

module.exports = {
  listResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};
