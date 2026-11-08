const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = config.port;

const startServer = async () => {
  // Attempt database connection if DATABASE_URL is configured
  if (config.databaseUrl) {
    await connectDB();
  } else {
    console.warn('⚠️ DATABASE_URL not set. Server starting without active database connection.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 DisasterReady Backend Server running on port ${PORT}`);
    console.log(`🌐 Health check available at: http://localhost:${PORT}/api/v1/health`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
