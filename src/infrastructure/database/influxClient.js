const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const config = require('../../config/influx.config');

const influxDB = new InfluxDB({ url: config.url, token: config.token });
const writeApi = influxDB.getWriteApi(config.org, config.bucket, 'ns');
const queryApi = influxDB.getQueryApi(config.org);

// Handle graceful shutdown
process.on('SIGINT', async () => {
    try {
        await writeApi.close();
        console.log('InfluxDB write API closed');
        process.exit(0);
    } catch (e) {
        console.error('Error closing InfluxDB write API', e);
        process.exit(1);
    }
});

module.exports = {
    writeApi,
    queryApi,
    Point
};