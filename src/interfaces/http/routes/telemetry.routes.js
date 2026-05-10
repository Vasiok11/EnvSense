const express = require('express');
const telemetryController = require('../controllers/telemetry.controller');
const authGuard = require('../middlewares/authGuard');
const deviceAccessGuard = require('../middlewares/deviceAccessGuard');

const router = express.Router();

// SSE Stream for real-time dashboard updates (no auth for demo, but normally protected)
router.get('/stream', telemetryController.streamTelemetry.bind(telemetryController));

// Get historical telemetry (requires valid JWT AND device ownership)
// GET /api/telemetry/:deviceId?view=24h
router.get(
    '/:deviceId', 
    authGuard, 
    deviceAccessGuard, 
    telemetryController.getDeviceTelemetry.bind(telemetryController)
);

module.exports = router;