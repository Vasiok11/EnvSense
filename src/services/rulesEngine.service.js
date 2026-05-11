const MqttPublisher = require('../infrastructure/mqtt/publisher');
const telemetryEvents = require('../utils/telemetryEvents');
const socketServer = require('../infrastructure/websocket/socketServer');

// In-memory state tracking for devices
// In a highly-distributed production environment, use Redis for this
const deviceState = new Map();

const COOLDOWN_PERIOD_MS = 15 * 60 * 1000; // 15 minutes
const CO2_THRESHOLD = 1000; // ppm
const REQUIRED_CONSECUTIVE_READINGS = 3;

class RulesEngineService {
    /**
     * Evaluates incoming telemetry point against business rules
     */
    async evaluate(deviceId, telemetry) {
        // Initialize state for the device if it doesn't exist
        if (!deviceState.has(deviceId)) {
            deviceState.set(deviceId, {
                consecutiveHighCO2: 0,
                lastTriggerTime: 0
            });
        }

        const state = deviceState.get(deviceId);
        
        // 1. Evaluate CO2 thresholds
        if (telemetry.co2 > CO2_THRESHOLD) {
            state.consecutiveHighCO2 += 1;
        } else {
            // Reset if it drops below threshold
            state.consecutiveHighCO2 = 0;
        }

        const now = Date.now();

        // 2. Check conditions: 3 consecutive readings AND occupancy confirmed (Ventilation trigger)
        if (state.consecutiveHighCO2 >= REQUIRED_CONSECUTIVE_READINGS && telemetry.occupancy) {
            if ((now - state.lastTriggerTime) > COOLDOWN_PERIOD_MS) {
                const msg = `[HVAC Trigger] ${deviceId}: Unhealthy CO2 (${telemetry.co2.toFixed(0)}ppm) in occupied room. Engaging Ventilation!`;
                
                try {
                    if (socketServer.getIO()) socketServer.getIO().emit('system_alert', { deviceId, message: msg, type: 'critical' });
                } catch(e) {}
                
                await this.triggerVentilation(deviceId);

                state.lastTriggerTime = now;
                state.consecutiveHighCO2 = 0; // Reset after trigger
            }
        }
        
        // 3. Evaluate Ghost Motion (High Radar Energy, but Occupancy = False)
        if (telemetry.radarEnergy > 60 && !telemetry.occupancy) {
            // Emits purely to UI for analytics
            const msg = `[Ghost Anomaly] ${deviceId}: Radar detecting massive motion (${telemetry.radarEnergy.toFixed(0)} energy) but target unconfirmed!`;
            if (socketServer.getIO()) socketServer.getIO().emit('system_alert', { deviceId, message: msg, type: 'warning' });
        }
        
        // 4. Overheating / Sub-zero warnings
        if (telemetry.temp > 28) {
            const msg = `[Thermal Alert] ${deviceId}: Dangerously hot environment (${telemetry.temp.toFixed(1)}°C).`;
            if (socketServer.getIO()) socketServer.getIO().emit('system_alert', { deviceId, message: msg, type: 'warning' });
        } else if (telemetry.temp < 15) {
            const msg = `[Thermal Alert] ${deviceId}: Freezing drop detected (${telemetry.temp.toFixed(1)}°C). Check windows.`;
            if (socketServer.getIO()) socketServer.getIO().emit('system_alert', { deviceId, message: msg, type: 'warning' });
        }
        
        // Save state back
        deviceState.set(deviceId, state);
    }

    async triggerVentilation(deviceId) {
        const payload = {
            command: 'activate_ventilation',
            duration_minutes: 15,
            reason: 'co2_and_occupancy_threshold_exceeded',
            timestamp: new Date().toISOString()
        };

        const topic = `envsense_pbl/command/${deviceId}`;
        
        try {
            await MqttPublisher.publish(topic, payload);
            const msg = `[Rules Engine] Command published to ${topic}`;
            console.log(msg);
            telemetryEvents.emit('system_log', { level: 'success', message: msg, deviceId, payload, timestamp: new Date().toISOString() });
        } catch (error) {
            const msg = `[Rules Engine] Failed to trigger ventilation for ${deviceId}: ${error.message}`;
            console.error(msg);
            telemetryEvents.emit('system_log', { level: 'error', message: msg, deviceId, timestamp: new Date().toISOString() });
        }
    }
}

module.exports = new RulesEngineService();