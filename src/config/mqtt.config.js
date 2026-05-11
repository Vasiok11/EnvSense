const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const options = {
    clientId: (process.env.MQTT_CLIENT_ID || 'envsense_backend') + '_' + Math.random().toString(16).slice(3),
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 1000,
    // Require valid certificates if we're in production
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    protocolVersion: 5 // Use MQTT v5 if possible
};

// TLS Hardening Configuration
if (process.env.MQTT_TLS_ENABLED === 'true') {
    options.protocol = 'mqtts';
    
    // Inject CA and Certs for Mutual TLS if provided
    if (process.env.MQTT_CA_PATH) {
        options.ca = [fs.readFileSync(process.env.MQTT_CA_PATH)];
    }
    if (process.env.MQTT_CERT_PATH && process.env.MQTT_KEY_PATH) {
        options.cert = fs.readFileSync(process.env.MQTT_CERT_PATH);
        options.key = fs.readFileSync(process.env.MQTT_KEY_PATH);
    }
}

if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME;
}
if (process.env.MQTT_PASSWORD) {
    options.password = process.env.MQTT_PASSWORD;
}

module.exports = {
    url: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883',
    options
};