const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    url: process.env.INFLUX_URL || 'http://localhost:8086',
    token: process.env.INFLUX_TOKEN || 'my-token',
    org: process.env.INFLUX_ORG || 'my-org',
    bucket: process.env.INFLUX_BUCKET || 'telemetry'
};