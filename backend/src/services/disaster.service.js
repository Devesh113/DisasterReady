const { prisma } = require('../config/db');

/**
 * Service handling Disaster CRUD operations for the DisasterReady platform.
 *
 * The Disaster model is a reference/catalog entity representing a type of disaster
 * (e.g., Earthquake, Flood). It is managed by ADMIN users and serves as a parent
 * entity for Alerts and SimulationScenarios.
 */
class DisasterService {
  /**
   * Create a new disaster entry
   * @param {Object} data - Validated disaster data (name, type, description, guidelines?, iconUrl?)
   * @returns {Promise<Object>} Created disaster record
   */
  async createDisaster(data) {
    try {
      const disaster = await prisma.disaster.create({
        data: {
          name: data.name,
          type: data.type,
          description: data.description,
          guidelines: data.guidelines || null,
          iconUrl: data.iconUrl || null,
        },
      });
      return disaster;
    } catch (error) {
      // Handle unique constraint violation on `name`
      if (error.code === 'P2002') {
        const err = new Error(`A disaster with the name "${data.name}" already exists.`);
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Retrieve all disasters with pagination, type filtering, and search
   * @param {Object} params
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Items per page
   * @param {string} [params.type] - Filter by DisasterType enum value
   * @param {string} [params.search] - Case-insensitive search on name and description
   * @returns {Promise<{data: Object[], pagination: Object}>}
   */
  async getAllDisasters({ page = 1, limit = 10, type, search }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const where = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [disasters, total] = await Promise.all([
      prisma.disaster.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.disaster.count({ where }),
    ]);

    return {
      data: disasters,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Retrieve a single disaster by its UUID
   * @param {string} id - Disaster UUID
   * @returns {Promise<Object>} Disaster record
   * @throws {Error} 404 if the disaster does not exist
   */
  async getDisasterById(id) {
    const disaster = await prisma.disaster.findUnique({
      where: { id },
    });

    if (!disaster) {
      const error = new Error('Disaster does not exist.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return disaster;
  }

  /**
   * Update an existing disaster with partial data
   * Only explicitly provided fields are updated (mass-assignment prevention)
   * @param {string} id - Disaster UUID
   * @param {Object} data - Validated partial update data
   * @returns {Promise<Object>} Updated disaster record
   */
  async updateDisaster(id, data) {
    // Verify the disaster exists before attempting an update
    await this.getDisasterById(id);

    // Build update payload with only allowed fields (mass-assignment prevention)
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.guidelines !== undefined) updateData.guidelines = data.guidelines;
    if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl;

    try {
      const updated = await prisma.disaster.update({
        where: { id },
        data: updateData,
      });
      return updated;
    } catch (error) {
      if (error.code === 'P2002') {
        const err = new Error(`A disaster with the name "${data.name}" already exists.`);
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Delete a disaster entry (hard delete per API contract)
   * @param {string} id - Disaster UUID
   * @throws {Error} 404 if disaster does not exist
   * @throws {Error} 409 if the disaster has related alerts or simulation scenarios
   */
  async deleteDisaster(id) {
    // Verify the disaster exists before attempting deletion
    await this.getDisasterById(id);

    try {
      await prisma.disaster.delete({
        where: { id },
      });
    } catch (error) {
      // Foreign key constraint: disaster has related alerts or simulation scenarios
      if (error.code === 'P2003') {
        const err = new Error(
          'Cannot delete this disaster because it has related alerts or simulation scenarios. Remove those first.'
        );
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new DisasterService();

