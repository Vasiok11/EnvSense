/**
 * Data Retention Policy Documentation / Pseudo-code
 * 
 * In a real production environment using InfluxDB v2, data retention is managed 
 * by bucketing and background tasks rather than directly in the Node.js app code.
 * 
 * Here is how you should configure your InfluxDB instance (via CLI or UI):
 * 
 * 1. Create Data Buckets:
 *    - `telemetry_raw` (Retention: 7 days) -> where our Node.js app writes payload data
 *    - `telemetry_hourly` (Retention: 30 days) -> aggregated data
 *    - `telemetry_daily` (Retention: 365 days / 1 year) -> aggregated data
 * 
 * 2. Setup InfluxDB Tasks for Downsampling:
 * 
 * // Task: Aggregate to Hourly (runs every 1 hour)
 * option task = {name: "downsample_hourly", every: 1h}
 * from(bucket: "telemetry_raw")
 *   |> range(start: -1h)
 *   |> filter(fn: (r) => r._measurement == "sensor_reading")
 *   |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
 *   |> to(bucket: "telemetry_hourly")
 * 
 * // Task: Aggregate to Daily (runs every 1 day)
 * option task = {name: "downsample_daily", every: 1d}
 * from(bucket: "telemetry_hourly")
 *   |> range(start: -1d)
 *   |> filter(fn: (r) => r._measurement == "sensor_reading")
 *   |> aggregateWindow(every: 1d, fn: mean, createEmpty: false)
 *   |> to(bucket: "telemetry_daily")
 */

module.exports = {
    // This file acts as a placeholder for infrastructure configuration documentation.
    retentionNotes: "Configure InfluxDB buckets natively. See within this file for the Flux scripts."
};