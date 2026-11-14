const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

const DISASTER_SELECT = {
  id: true,
  name: true,
  type: true,
};

const SCENARIO_SUMMARY_SELECT = {
  id: true,
  title: true,
  difficultyLevel: true,
  maxScore: true,
};

/**
 * Simulation Service
 * Handles Unity simulation scenarios, player attempts, decision tracking, and scores.
 */
class SimulationService {
  /**
   * List simulation scenarios
   * @param {Object} query - Validated query parameters
   * @returns {Promise<{ scenarios: Object[], pagination: Object }>}
   */
  async listScenarios(query) {
    const { page = 1, limit = 10, difficultyLevel, disasterId, isActive, search } = query;

    const whereClause = {};

    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    } else {
      whereClause.isActive = true; // default active
    }

    if (difficultyLevel !== undefined) {
      whereClause.difficultyLevel = difficultyLevel;
    }

    if (disasterId) {
      whereClause.disasterId = disasterId;
    }

    if (search) {
      const term = search.trim();
      whereClause.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, scenarios] = await Promise.all([
      prisma.simulationScenario.count({ where: whereClause }),
      prisma.simulationScenario.findMany({
        where: whereClause,
        include: {
          disaster: { select: DISASTER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      scenarios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get simulation scenario by ID
   * @param {string} id - Scenario UUID
   * @returns {Promise<Object>}
   */
  async getScenarioById(id) {
    const scenario = await prisma.simulationScenario.findUnique({
      where: { id },
      include: {
        disaster: { select: { id: true, name: true, type: true, guidelines: true } },
      },
    });

    if (!scenario) {
      throw new ApiError(404, 'Simulation scenario not found.', 'NOT_FOUND');
    }

    return scenario;
  }

  /**
   * Create a new simulation scenario (ADMIN only)
   * @param {Object} data - Validated scenario data
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>}
   */
  async createScenario(data, user) {
    if (user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: Only administrators can create simulation scenarios.', 'FORBIDDEN');
    }

    // Verify disaster exists
    const disaster = await prisma.disaster.findUnique({ where: { id: data.disasterId } });
    if (!disaster) {
      throw new ApiError(404, 'Associated disaster not found.', 'NOT_FOUND');
    }

    const scenario = await prisma.simulationScenario.create({
      data: {
        title: data.title,
        description: data.description,
        difficultyLevel: data.difficultyLevel,
        durationMinutes: data.durationMinutes,
        maxScore: data.maxScore,
        isActive: data.isActive !== undefined ? data.isActive : true,
        disasterId: data.disasterId,
      },
      include: {
        disaster: { select: DISASTER_SELECT },
      },
    });

    return scenario;
  }

  /**
   * Start a new simulation attempt
   * @param {string} scenarioId - Scenario UUID
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Created attempt
   */
  async startAttempt(scenarioId, userId) {
    const scenario = await prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario || !scenario.isActive) {
      throw new ApiError(404, 'Simulation scenario not found or is inactive.', 'NOT_FOUND');
    }

    const attempt = await prisma.simulationAttempt.create({
      data: {
        userId,
        scenarioId,
        status: 'IN_PROGRESS',
        score: 0,
        timeSpentSecs: 0,
        startedAt: new Date(),
      },
    });

    return attempt;
  }

  /**
   * Update a simulation attempt (finish or abandon)
   * @param {string} attemptId - Attempt UUID
   * @param {Object} data - Update data ({ status, score, timeSpentSecs })
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Updated attempt
   */
  async updateAttempt(attemptId, data, userId) {
    const attempt = await prisma.simulationAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new ApiError(404, 'Simulation attempt not found.', 'NOT_FOUND');
    }

    if (attempt.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You cannot modify another user\'s simulation attempt.', 'FORBIDDEN');
    }

    const updateData = {
      status: data.status,
      completedAt: new Date(),
    };

    if (data.score !== undefined) updateData.score = data.score;
    if (data.timeSpentSecs !== undefined) updateData.timeSpentSecs = data.timeSpentSecs;

    const updated = await prisma.simulationAttempt.update({
      where: { id: attemptId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Get simulation attempt details including all player decisions
   * @param {string} attemptId - Attempt UUID
   * @param {Object} user - Authenticated user context
   * @returns {Promise<Object>}
   */
  async getAttemptById(attemptId, user) {
    const attempt = await prisma.simulationAttempt.findUnique({
      where: { id: attemptId },
      include: {
        scenario: { select: SCENARIO_SUMMARY_SELECT },
        decisions: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!attempt) {
      throw new ApiError(404, 'Simulation attempt not found.', 'NOT_FOUND');
    }

    if (attempt.userId !== user.id && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: You cannot view another user\'s simulation attempt.', 'FORBIDDEN');
    }

    return attempt;
  }

  /**
   * Record an in-game decision during a simulation attempt
   * @param {string} attemptId - Attempt UUID
   * @param {Object} data - Decision data
   * @param {string} userId - Authenticated user UUID
   * @returns {Promise<Object>} Created decision
   */
  async recordDecision(attemptId, data, userId) {
    const attempt = await prisma.simulationAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new ApiError(404, 'Simulation attempt not found.', 'NOT_FOUND');
    }

    if (attempt.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You cannot record decisions on another user\'s simulation attempt.', 'FORBIDDEN');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new ApiError(
        400,
        `Cannot record decisions on a simulation attempt that is ${attempt.status.toLowerCase()}. Only IN_PROGRESS attempts accept decisions.`,
        'VALIDATION_ERROR'
      );
    }

    const decision = await prisma.simulationDecision.create({
      data: {
        attemptId,
        stepNumber: data.stepNumber,
        situation: data.situation,
        chosenOption: data.chosenOption,
        isCorrect: data.isCorrect,
        pointsAwarded: data.pointsAwarded,
        timeTakenSecs: data.timeTakenSecs ?? null,
      },
    });

    return decision;
  }

  /**
   * Get user's simulation attempt history
   * @param {string} userId - User UUID
   * @param {Object} query - Query parameters ({ page, limit, status, scenarioId })
   * @returns {Promise<{ attempts: Object[], pagination: Object }>}
   */
  async getUserAttempts(userId, query) {
    const { page = 1, limit = 10, status, scenarioId } = query;
    const whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    if (scenarioId) {
      whereClause.scenarioId = scenarioId;
    }

    const skip = (page - 1) * limit;

    const [total, attempts] = await Promise.all([
      prisma.simulationAttempt.count({ where: whereClause }),
      prisma.simulationAttempt.findMany({
        where: whereClause,
        include: {
          scenario: { select: SCENARIO_SUMMARY_SELECT },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = new SimulationService();

