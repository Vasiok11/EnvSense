const { writeApi, queryApi, Point } = require('../infrastructure/database/influxClient');
const config = require('../config/influx.config');

class TelemetryRepository {
    /**
     * Stores a telemetry point directly into InfluxDB
     */
    async storeTelemetry({ deviceId, room, co2, temp, humidity, occupancy, radarEnergy }) {
        // Validation could be added here or ideally in the Service layer
        
        const point = new Point('sensor_reading')
            .tag('device_id', deviceId)
            .tag('room', room || 'unknown')
            .tag('occupancy', occupancy ? 'true' : 'false') // Tags must be strings
            .floatField('co2_ppm', co2)
            .floatField('temp_c', temp)
            .floatField('humidity_pct', humidity)
            .floatField('radar_energy', radarEnergy || 0)
            .timestamp(new Date());

        try {
            writeApi.writePoint(point);
            await writeApi.flush();
        } catch (error) {
            console.error('Failed to write to InfluxDB:', error);
            throw new Error('Database write error');
        }
    }

    /**
     * Retrieves raw historical telemetry for a range (defaults to last 24h)
     */
    async getTelemetryRange(deviceId, timeRangeStart = '-24h', timeRangeStop = 'now()') {
        // Note: For queries spanning longer time periods (7d, 30d), querying aggregated buckets 
        // through InfluxDB tasks/retention policies is generally preferred to save payload size.

        const fluxQuery = `
            from(bucket: "${config.bucket}")
                |> range(start: ${timeRangeStart}, stop: ${timeRangeStop})
                |> filter(fn: (r) => r._measurement == "sensor_reading")
                |> filter(fn: (r) => r.device_id == "${deviceId}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> drop(columns: ["_start", "_stop", "_measurement"])
        `;

        try {
            const results = [];
            for await (const row of queryApi.iterateRows(fluxQuery)) {
                const data = queryApi.withRows(fluxQuery).mapRow(row.values, row.tableMeta);
                results.push({
                    time: data._time,
                    co2_ppm: data.co2_ppm,
                    temp_c: data.temp_c,
                    humidity_pct: data.humidity_pct,
                    occupancy: data.occupancy === 'true',
                    radar_energy: data.radar_energy
                });
            }
            return results;
        } catch (error) {
            console.error('Failed to query InfluxDB:', error);
            throw new Error('Database query error');
        }
    }
}

module.exports = new TelemetryRepository();