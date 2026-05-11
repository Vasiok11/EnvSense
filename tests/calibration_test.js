// Mock MQTT Publisher to avoid actual network calls during unit testing
const assert = require('assert');
const proxyquire = require('proxyquire');

let publishedTopics = [];
const MockPublisher = {
    publish: async (topic, payload) => {
        publishedTopics.push({ topic, payload });
        return true;
    }
};

const calibrationService = proxyquire('../src/services/calibration.service.js', {
    '../infrastructure/mqtt/publisher': MockPublisher
});
const mockData = require('./mock_data/calibration_mock_data.json');

async function runCalibrationTests() {
    console.log('--- Starting Sensor Calibration Tests ---');
    let passed = 0;
    let failed = 0;

    // Test 1: Burn-In Initiation
    try {
        publishedTopics = [];
        const result = await calibrationService.startBurnIn('device_001');
        assert.strictEqual(result.mode, 'burn_in');
        assert.strictEqual(publishedTopics.length, 1);
        assert.strictEqual(publishedTopics[0].topic, '/command/device_001');
        assert.strictEqual(publishedTopics[0].payload.command, 'set_burn_in');
        console.log('[PASS] Burn-in initiation dispatches correct MQTT command.');
        passed++;
    } catch (e) {
        console.error('[FAIL] Burn-in initiation test failed:', e.message);
        failed++;
    }

    // Test 2: FRC Zeroing
    try {
        publishedTopics = [];
        const result = await calibrationService.triggerZeroing('device_002', 400);
        assert.strictEqual(result.mode, 'frc');
        assert.strictEqual(publishedTopics[0].topic, '/command/device_002');
        assert.strictEqual(publishedTopics[0].payload.ref_co2, 400);
        console.log('[PASS] FRC zeroing dispatches correct MQTT command.');
        passed++;
    } catch (e) {
        console.error('[FAIL] FRC zeroing test failed:', e.message);
        failed++;
    }

    // Test 3: Drift Detection (Drifted High)
    try {
        const result = calibrationService.evaluateDrift('device_003', mockData.drift_scenario);
        assert.strictEqual(result.driftDetected, true);
        assert.strictEqual(result.baselineObserved, 510);
        console.log('[PASS] Drift actively detected (Inflated baseline).');
        passed++;
    } catch (e) {
        console.error('[FAIL] Drift high detection test failed:', e.message);
        failed++;
    }

    // Test 4: Drift Detection (Healthy)
    try {
        const result = calibrationService.evaluateDrift('device_003', mockData.healthy_scenario);
        assert.strictEqual(result.driftDetected, false);
        assert.strictEqual(result.baselineObserved, 405);
        console.log('[PASS] No drift detected for healthy sensor.');
        passed++;
    } catch (e) {
        console.error('[FAIL] Healthy drift detection test failed:', e.message);
        failed++;
    }
    
    // Test 5: Drift Detection (Under Reporting)
    try {
        const result = calibrationService.evaluateDrift('device_003', mockData.under_reporting_scenario);
        assert.strictEqual(result.driftDetected, true);
        assert.strictEqual(result.baselineObserved, 340);
        console.log('[PASS] Drift actively detected (Under-reporting baseline).');
        passed++;
    } catch (e) {
        console.error('[FAIL] Drift low detection test failed:', e.message);
        failed++;
    }

    console.log('-----------------------------------------');
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runCalibrationTests();
