const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const authRoutes = require('./routes/auth.routes');

const app = express();

// ==========================================
// Global Middleware
// ==========================================

// Enable CORS with credentials support
app.use(cors({
  origin: config.clientOrigin === '*' ? true : config.clientOrigin,
  credentials: true,
}));

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
// API Routes
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// ==========================================
// 404 & Centralized Error Handling
// ==========================================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
