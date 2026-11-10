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
const notificationRoutes = require('./routes/notification.routes');
const emergencyResourceRoutes = require('./routes/emergencyResource.routes');
const preparednessKitRoutes = require('./routes/preparednessKit.routes');
const eventRoutes = require('./routes/event.routes');
const registrationRoutes = require('./routes/registration.routes');
const incidentController = require('./controllers/incident.controller');
const registrationController = require('./controllers/registration.controller');
const { authenticate } = require('./middleware/auth');
const { validateQuery } = require('./middleware/validate');
const { queryIncidentSchema } = require('./validators/incident.validator');
const { queryRegistrationSchema } = require('./validators/registration.validator');

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

app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use('/api/emergency-resources', emergencyResourceRoutes);
app.use('/api/v1/emergency-resources', emergencyResourceRoutes);

app.use('/api/preparedness-kit', preparednessKitRoutes);
app.use('/api/v1/preparedness-kit', preparednessKitRoutes);

app.use('/api/events', eventRoutes);
app.use('/api/v1/events', eventRoutes);

app.use('/api/registrations', registrationRoutes);
app.use('/api/v1/registrations', registrationRoutes);

// User-scoped Event Registrations endpoint (API_CONTRACTS.md line 1277)
app.get('/api/v1/users/me/registrations', authenticate, validateQuery(queryRegistrationSchema), registrationController.getMyRegistrations);
app.get('/api/users/me/registrations', authenticate, validateQuery(queryRegistrationSchema), registrationController.getMyRegistrations);

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
