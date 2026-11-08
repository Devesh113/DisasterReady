const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

// ==========================================
// Global Middleware
// ==========================================

// Enable CORS
app.use(cors({
  origin: config.clientOrigin === '*' ? true : config.clientOrigin,
  credentials: true,
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Base / Health Check Route
// ==========================================

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0',
    },
    message: 'DisasterReady API service is healthy',
  });
});

// ==========================================
// 404 & Centralized Error Handling
// ==========================================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
