const dotenv = require('dotenv');
dotenv.config();

const options = {
    clientId: (process.env.MQTT_CLIENT_ID || 'envsense_backend') + '_' + Math.random().toString(16).slice(3),
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 1000,
    rejectUnauthorized: false
};

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