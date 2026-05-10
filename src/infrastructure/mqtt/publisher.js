const mqttClient = require('./mqttClient');

class MqttPublisher {
    /**
     * Publishes a message to a specific topic
     * @param {string} topic - The MQTT topic
     * @param {object|string} payload - The message to publish
     * @param {object} options - Publish options (qos, retain)
     */
    static async publish(topic, payload, options = { qos: 1, retain: false }) {
        const client = mqttClient.getClient();
        const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
        
        return new Promise((resolve, reject) => {
            client.publish(topic, message, options, (err) => {
                if (err) {
                    console.error(`Failed to publish to ${topic}:`, err);
                    return reject(err);
                }
                console.log(`Published to ${topic}`);
                resolve();
            });
        });
    }
}

module.exports = MqttPublisher;