const telemetryRepo = require('../repositories/telemetry.repo');
const rulesEngineService = require('./rulesEngine.service');
const telemetryEvents = require('../utils/telemetryEvents');
const socketServer = require('../infrastructure/websocket/socketServer');

class IngestionService {
    /**
     * Processes incoming telemetry data non-blockingly
     */
    async processTelemetry(deviceId, payload) {
        try {
            // 1. Validate payload shape (basic validation for example)
            if (!payload || typeof payload.co2 !== 'number') {
                console.warn(`[Ingestion Service] Invalid payload from ${deviceId}`, payload);
                return;
            }

            const telemetryData = {
                deviceId,
                room: payload.room || 'default',
                co2: payload.co2,
                temp: payload.temp,
                humidity: payload.humidity,
                occupancy: payload.occupancy || false,
                radarEnergy: payload.radar_energy || 0
            };

            // 2. Offload into Storage (InfluxDB)
            // Fire-and-forget (do not await if we want purely non-blocking, but catching errors is good)
            telemetryRepo.storeTelemetry(telemetryData)
                .catch(err => {
                    // Suppress verbose connection refused errors if we don't have InfluxDB running locally
                    if (err.message === 'Database write error') {
                        // Silent fail for mock testing
                    } else {
                        console.error(`[Ingestion DB Error] ${deviceId}:`, err.message);
                    }
                });

            // 3. Offload to Rules Engine for real-time alerting
            rulesEngineService.evaluate(deviceId, telemetryData)
                .catch(err => console.error(`[Ingestion Rule Error] ${deviceId}:`, err.message));

            // 4. Emit event for SSE/WebSockets for real-time frontend updates
            telemetryEvents.emit('new_telemetry', telemetryData);
            
            // Broadcast live data via Socket.io
            try {
                if (socketServer.getIO()) {
                    socketServer.getIO().emit('live_telemetry', telemetryData);
                }
            } catch (e) {
                // Ignore if IO not initialized
            }

        } catch (error) {
            console.error(`[Ingestion Service] Crash while processing ${deviceId}:`, error);
        }
    }

    /**
     * Processes device disconnections (LWT)
     */
    async processStatus(deviceId, payload) {
        // e.g., Payload looks like: { state: "offline", reason: "LWT" }
        const msg = `[Status] Device ${deviceId} status update: ${JSON.stringify(payload)}`;
        console.log(msg);
        telemetryEvents.emit('system_log', { level: 'info', message: msg, deviceId, timestamp: new Date().toISOString() });
        // Could be saved to a database table or cache to show "Offline" flag in UI
    }
}

module.exports = new IngestionService();