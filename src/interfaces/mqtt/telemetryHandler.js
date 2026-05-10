const ingestionService = require('../../services/ingestion.service');

const handleTelemetry = (topic, message) => {
    // Topic: envsense_pbl/telemetry/esp32_c3_env_01
    const parts = topic.split('/');
    const deviceId = parts[2];

    try {
        const payload = JSON.parse(message.toString());
        ingestionService.processTelemetry(deviceId, payload);
    } catch (e) {
        console.error(`[Telemetry Handler] Failed to parse JSON from ${deviceId}:`, e);
    }
};

module.exports = handleTelemetry;