const MqttPublisher = require('../infrastructure/mqtt/publisher');

class CalibrationService {
    constructor() {
        this.deviceStates = new Map();
    }

    /**
     * Initiates a Continuous Operation (Burn-in) period for the SCD40
     * which typically takes 24-48 hours of constant power to self-calibrate.
     */
    async startBurnIn(deviceId, durationHours = 48) {
        const payload = {
            command: "set_burn_in",
            duration_h: durationHours
        };
        const topic = `/command/${deviceId}`;
        
        this.deviceStates.set(deviceId, { status: "burn_in", since: Date.now() });
        
        try {
            await MqttPublisher.publish(topic, payload);
        } catch (e) {
            console.error(`[Calibration] Failed to send burn-in to ${deviceId}`);
        }
        
        return { success: true, deviceId, mode: "burn_in" };
    }

    /**
     * Triggers Forced Recalibration (FRC) or 'zeroing'.
     * Often done by bringing the device to fresh air (~400ppm).
     */
    async triggerZeroing(deviceId, refCO2 = 400) {
        if (refCO2 < 400 || refCO2 > 2000) {
            throw new Error('Reference CO2 must be between 400 and 2000 ppm.');
        }

        const payload = {
            command: "calibrate_frc",
            ref_co2: refCO2
        };
        const topic = `/command/${deviceId}`;

        this.deviceStates.set(deviceId, { status: "calibrating", since: Date.now() });
        
        try {
            await MqttPublisher.publish(topic, payload);
        } catch (e) {
            console.error(`[Calibration] Failed to send FRC to ${deviceId}`);
        }
        
        return { success: true, deviceId, mode: "frc", reference: refCO2 };
    }

    /**
     * Periodic Accuracy Check.
     * Analyzes historical baseline over a period (e.g., nights/weekends)
     * If the baseline (lowest reliably recorded CO2) deviates from ~400ppm significantly,
     * it suggests calibration drift.
     */
    evaluateDrift(deviceId, historicalReadings) {
        if (!historicalReadings || historicalReadings.length === 0) {
            return { driftDetected: false, reason: "Insufficient data" };
        }

        // Find the lowest CO2 reading (assuming the building empties and hits ~400ppm base)
        const lowestReading = Math.min(...historicalReadings.map(r => r.co2));

        // SCD40 typical accuracy is ±(50 ppm + 5% of reading)
        // Let's assume an empty indoor environment shouldn't stay above 450ppm minimum.
        if (lowestReading > 450) {
            return {
                driftDetected: true,
                suggestCalibration: true,
                baselineObserved: lowestReading,
                reason: `Baseline CO2 is inflated (${lowestReading} ppm). Potential sensor drift.`
            };
        } else if (lowestReading < 380) {
            return {
                driftDetected: true,
                suggestCalibration: true,
                baselineObserved: lowestReading,
                reason: `Baseline CO2 is unusually low (${lowestReading} ppm). Potential sensor drift.`
            };
        }

        return {
            driftDetected: false,
            suggestCalibration: false,
            baselineObserved: lowestReading,
            reason: "Sensor is within expected baseline variance."
        };
    }
}

module.exports = new CalibrationService();
