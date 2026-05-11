const telemetryRepo = require('../repositories/telemetry.repo');
const rulesEngineService = require('./rulesEngine.service');
const telemetryEvents = require('../utils/telemetryEvents');
const socketServer = require('../infrastructure/websocket/socketServer');
const AQICalculator = require('../utils/aqiCalculator');
const ComfortCalculator = require('../utils/comfortCalculator');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

class IngestionService {
    /**
     * Processes incoming telemetry data non-blockingly
     */
    async processTelemetry(deviceId, payload) {
        const startTime = Date.now();
        
        try {
            // 1. Validate payload shape (basic validation for example)
            if (!payload || typeof payload.co2 !== 'number') {
                logger.warn('Invalid payload format', { deviceId, payload });
                metrics.increment('telemetry_processing_failed');
                return;
            }

            const telemetryData = {
                deviceId,
                room: payload.room || 'default',
                co2: payload.co2,
                temp: payload.temp,
                humidity: payload.humidity,
                occupancy: payload.occupancy || false,
                radarEnergy: payload.radar_energy || 0,
                aqi: AQICalculator.calculateAQI(payload.co2),
                comfort: ComfortCalculator.calculate(payload.temp, payload.humidity)
            };

            metrics.increment('telemetry_ingested_total');

            // 2. Offload into Storage (InfluxDB)
            telemetryRepo.storeTelemetry(telemetryData)
                .catch(err => {
                    metrics.increment('database_write_errors');
                    if (err.message !== 'Database write error' && !err.message.includes('Database connection reset')) {
                        logger.error('Database insertion failed', err, { deviceId });
                    }
                });

            // 3. Offload to Rules Engine for real-time alerting
            rulesEngineService.evaluate(deviceId, telemetryData)
                .catch(err => {
                    metrics.increment('rules_engine_errors');
                    logger.error('Rules engine evaluation failed', err, { deviceId });
                });

            // 4. Emit event for SSE/WebSockets for real-time frontend updates
            telemetryEvents.emit('new_telemetry', telemetryData);
            
            try {
                if (socketServer.getIO()) {
                    socketServer.getIO().emit('live_telemetry', telemetryData);
                    metrics.increment('websocket_broadcasts_total');
                }
            } catch (e) {
                // Ignore if IO not initialized
            }

            const latency = Date.now() - startTime;
            metrics.observe('ingestion_processing_latency', latency);

        } catch (error) {
            metrics.increment('telemetry_processing_crashes');
            logger.error('Severe crash while processing ingestion pipeline', error, { deviceId });
        }
    }

    /**
     * Processes device disconnections (LWT)
     */
    async processStatus(deviceId, payload) {
        metrics.increment('device_status_changes');
        logger.info('Device status update', { deviceId, payload });
        telemetryEvents.emit('system_log', { level: 'info', message: 'Device status updated', deviceId, timestamp: new Date().toISOString() });
    }
}

module.exports = new IngestionService();