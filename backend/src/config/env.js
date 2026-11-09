const dotenv = require('dotenv');

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

// Fail fast if required secrets are missing in production
if (nodeEnv === 'production') {
  if (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET.length < 32) {
    throw new Error('FATAL CONFIGURATION ERROR: ACCESS_TOKEN_SECRET must be set to a secure string of at least 32 characters in production.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('FATAL CONFIGURATION ERROR: DATABASE_URL must be set in production.');
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || (nodeEnv === 'development' ? 'disaster_ready_dev_secret_key_minimum_32_chars_long!' : undefined),
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS, 10) || 7,
  },
};

module.exports = config;
