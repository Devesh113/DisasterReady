const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const authRoutes = require('./routes/auth.routes');
const disasterRoutes = require('./routes/disaster.routes');
const alertRoutes = require('./routes/alert.routes');
const incidentRoutes = require('./routes/incident.routes');
const incidentController = require('./controllers/incident.controller');
const { authenticate } = require('./middleware/auth');
const { validateQuery } = require('./middleware/validate');
const { queryIncidentSchema } = require('./validators/incident.validator');

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

app.use('/api/disasters', disasterRoutes);
app.use('/api/v1/disasters', disasterRoutes);

app.use('/api/alerts', alertRoutes);
app.use('/api/v1/alerts', alertRoutes);

app.use('/api/incidents', incidentRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/incident-reports', incidentRoutes);
app.use('/api/v1/incident-reports', incidentRoutes);

// User-scoped Incident Reports endpoints (API_CONTRACTS.md line 1863)
app.get('/api/v1/users/me/incident-reports', authenticate, validateQuery(queryIncidentSchema), incidentController.getMyIncidents);
app.get('/api/users/me/incident-reports', authenticate, validateQuery(queryIncidentSchema), incidentController.getMyIncidents);
app.get('/api/v1/users/me/incidents', authenticate, validateQuery(queryIncidentSchema), incidentController.getMyIncidents);
app.get('/api/users/me/incidents', authenticate, validateQuery(queryIncidentSchema), incidentController.getMyIncidents);

// ==========================================
// 404 & Centralized Error Handling
// ==========================================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
