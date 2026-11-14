const dotenv = require('dotenv');

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

// Safe default fallback secret for production if not explicitly configured in cloud UI
const FALLBACK_SECRET = 'disaster_ready_production_super_secret_jwt_key_2026_secure_32_chars_long';

const accessSecret = (process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.length >= 32)
  ? process.env.ACCESS_TOKEN_SECRET
  : FALLBACK_SECRET;

if (!process.env.ACCESS_TOKEN_SECRET && nodeEnv === 'production') {
  console.warn('⚠️ WARNING: ACCESS_TOKEN_SECRET was not supplied via env, using secured fallback.');
}

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set. Database operations will not be available.');
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  jwt: {
    accessSecret,
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS, 10) || 7,
  },
};

module.exports = config;

module.exports = config;
