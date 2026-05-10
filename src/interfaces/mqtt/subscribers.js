const telemetryHandler = require('./telemetryHandler');
const statusHandler = require('./statusHandler');

/**
 * Maps MQTT topics to their respective handler functions
 */
const startSubscribers = (mqttClient) => {
    const topicSubMap = {
        'envsense_pbl/telemetry/+': telemetryHandler,
        'envsense_pbl/status/+': statusHandler
    };

    // Subscribe to all topics
    Object.keys(topicSubMap).forEach(topic => {
        mqttClient.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${topic}`, err);
            } else {
                console.log(`Subscribed to topic: ${topic}`);
            }
        });
    });

    // Global message dispatcher
    mqttClient.on('message', (topic, message) => {
        // Simple routing mechanism based on topic prefix
        if (topic.startsWith('envsense_pbl/telemetry/')) {
            topicSubMap['envsense_pbl/telemetry/+'](topic, message);
        } else if (topic.startsWith('envsense_pbl/status/')) {
            topicSubMap['envsense_pbl/status/+'](topic, message);
        } else {
            console.log(`Received message on unmapped topic ${topic}`);
        }
    });
};

module.exports = startSubscribers;