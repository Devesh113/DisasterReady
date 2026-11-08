const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const config = require('./env');

// ============================================================================
// PostgreSQL Pool & Prisma Client (Prisma 7 Adapter Configuration)
// ============================================================================

const pool = new Pool({
  connectionString: config.databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * Test the database connection
 * @returns {Promise<boolean>}
 */
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully via Prisma 7 (pg adapter)');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Graceful disconnect for both Prisma Client and PostgreSQL connection pool
 */
const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log('Database and connection pool disconnected gracefully');
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
  }
};

module.exports = {
  prisma,
  pool,
  connectDB,
  disconnectDB,
};
