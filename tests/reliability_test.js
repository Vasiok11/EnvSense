const assert = require('assert');
const proxyquire = require('proxyquire');

// State trackers for assertions
let dbFailures = 0;
let ruleFailures = 0;
let successfulWrites = 0;

// Mock dependencies to simulate random infrastructure failures
const mockTelemetryRepo = {
    storeTelemetry: async (data) => {
        // Simulate random DB failure (e.g. InfluxDB connection drop) with 10% probability
        if (Math.random() < 0.1) {
            dbFailures++;
            throw new Error('Database connection reset by peer');
        }
        successfulWrites++;
        return true;
    }
};

const mockRulesEngine = {
    evaluate: async (deviceId, data) => {
        // Simulate evaluating rule failure with 5% probability
        if (Math.random() < 0.05) {
            ruleFailures++;
            throw new Error('Timeout communicating with rules constraint evaluator');
        }
        return true;
    }
};

const mockSocketServer = {
    getIO: () => null // Silence websockets for stress test
};

// Suppress console.error during the test to avoid flooding stdout with our expected simulation errors
const originalConsoleError = console.error;
console.error = (msg, err) => {
    // Only print true crashes, ignore expected mock errors
    if (msg.includes('Crash while processing')) originalConsoleError(msg, err);
};

const ingestionService = proxyquire('../src/services/ingestion.service', {
    '../repositories/telemetry.repo': mockTelemetryRepo,
    './rulesEngine.service': mockRulesEngine,
    '../infrastructure/websocket/socketServer': mockSocketServer
});

async function runReliabilityTests() {
    console.log('--- Starting Reliability & Stress Tests ---');
    
    // Simulate 5000 incoming telemetry messages from edge devices
    const TOTAL_PAYLOADS = 5000;
    const CONCURRENT_BATCH = 1000;

    const payloads = Array.from({ length: TOTAL_PAYLOADS }, (_, i) => ({
        co2: 400 + (Math.random() * 800), // Random CO2 between 400-1200
        temp: 20 + (Math.random() * 5),
        humidity: 40 + (Math.random() * 20),
        occupancy: Math.random() > 0.5,
        radar_energy: Math.random() * 100
    }));

    const startTime = Date.now();

    // Emulate heavy bursts of traffic by dumping thousands of messages concurrently
    for (let i = 0; i < TOTAL_PAYLOADS; i += CONCURRENT_BATCH) {
        const batch = payloads.slice(i, i + CONCURRENT_BATCH);
        
        // Fire all messages into the processing pipeline simultaneously
        await Promise.all(batch.map((p, idx) => 
            ingestionService.processTelemetry(`stress_device_${i + idx}`, p)
        ));
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Restore console.error
    console.error = originalConsoleError;

    // Output stats
    console.log(`[Metrics] Processed ${TOTAL_PAYLOADS} concurrent telemetry events in ${durationMs}ms`);
    console.log(`[Metrics] DB Operations: ${successfulWrites} Success / ${dbFailures} Network Failures (Simulated)`);
    console.log(`[Metrics] Rules Engine: Timeout Failures (Simulated): ${ruleFailures}`);

    try {
        // Assertions: Ensure no data was lost entirely from the processing flow, even if DB rejected some
        assert.strictEqual(successfulWrites + dbFailures, TOTAL_PAYLOADS, 'All telemetry events should have passed through the persistence request phase.');
        
        // Assertions: Ensure performance meets real-time criteria
        assert.ok(durationMs < 3000, `Throughput degradation! Expected under 3 seconds, took ${durationMs}ms.`);
        
        console.log('[PASS] System demonstrated non-blocking resilience. Ingestion pipeline survived high concurrency and random sub-system failures without crashing.');
    } catch (e) {
        console.error('[FAIL] Reliability constraints broken:', e.message);
        process.exit(1);
    }
    
    console.log('-------------------------------------------');
}

runReliabilityTests().catch(err => {
    console.error('[CRITICAL FAIL] Test harness crashed:', err);
    process.exit(1);
});
