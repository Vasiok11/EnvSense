const telemetryRepo = require('../repositories/telemetry.repo');

class TelemetryService {
    /**
     * Get historical telemetry data based on a pre-defined time view (e.g., 24h, 7d)
     */
    async getTelemetryHistory(deviceId, view = '24h') {
        let startRange = '-24h';
        
        if (view === '7d') {
            startRange = '-7d';
            // In a real scenario, you would query the 'telemetry_hourly' bucket here
            // instead of 'telemetry_raw' to prevent massive payload sizes.
        } else if (view === '1h') {
            startRange = '-1h';
        }

        const data = await telemetryRepo.getTelemetryRange(deviceId, startRange, 'now()');

        // Can apply further data massaging/transformations here before sending to UI
        return data;
    }
}

module.exports = new TelemetryService();