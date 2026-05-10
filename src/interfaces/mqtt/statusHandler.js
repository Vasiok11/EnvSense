const ingestionService = require('../../services/ingestion.service');

const handleStatus = (topic, message) => {
    // Topic: envsense_pbl/status/esp32_c3_env_01
    const parts = topic.split('/');
    const deviceId = parts[2];

    try {
        const payload = JSON.parse(message.toString());
        ingestionService.processStatus(deviceId, payload);
    } catch (e) {
        console.error(`[Status Handler] Failed to parse JSON from ${deviceId}:`, e);
    }
};

module.exports = handleStatus;