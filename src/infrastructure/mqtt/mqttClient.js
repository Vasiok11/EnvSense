const mqtt = require('mqtt');
const config = require('../../config/mqtt.config');

class MqttClient {
    constructor() {
        this.client = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            console.log(`Connecting to MQTT broker at ${config.url}...`);
            this.client = mqtt.connect(config.url, config.options);

            this.client.on('connect', () => {
                console.log('Successfully connected to MQTT broker');
                resolve(this.client);
            });

            this.client.on('error', (err) => {
                console.error('MQTT Connection error:', err);
                reject(err);
            });

            this.client.on('offline', () => {
                console.log('MQTT Client offline');
            });
        });
    }

    getClient() {
        if (!this.client) {
            throw new Error('MQTT Client not initialized. Call connect() first.');
        }
        return this.client;
    }
}

module.exports = new MqttClient();