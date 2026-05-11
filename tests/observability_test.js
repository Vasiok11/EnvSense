const proxyquire = require('proxyquire');
const metrics = require('../src/utils/metrics');
const logger = require('../src/utils/logger');

// Mocks to allow pipeline to run cleanly without spinning up database
const mockTelemetryRepo = {
    storeTelemetry: async () => {
        // Random latency 5-30ms
        await new Promise(r => setTimeout(r, 5 + Math.random() * 25));
        // Random 2% failure for graphing
        if (Math.random() < 0.02) throw new Error('Simulated Database Timeout');
        return true;
    }
};

const mockRulesEngine = {
    evaluate: async () => {
        await new Promise(r => setTimeout(r, 2 + Math.random() * 10));
        return true;
    }
};

const ingestionService = proxyquire('../src/services/ingestion.service', {
    '../repositories/telemetry.repo': mockTelemetryRepo,
    './rulesEngine.service': mockRulesEngine,
    '../utils/logger': logger,
    '../utils/metrics': metrics
});

async function runObservabilityMock() {
    logger.info('Starting Observability Mock Data Generation...', { test_id: 'OBS_001' });

    // Inject data slowly to show varied metrics
    const totalPumps = 200;
    
    for (let i = 0; i < totalPumps; i++) {
        // Simulate concurrent packet bursts (10-30 at once)
        const burstSize = Math.floor(Math.random() * 20) + 10; 
        
        const promises = [];
        for (let b = 0; b < burstSize; b++) {
            const payload = {
                co2: 400 + Math.random() * 200,
                temp: 22,
                humidity: 45,
                occupancy: true
            };
            promises.push(ingestionService.processTelemetry(`device_${Math.floor(Math.random() * 5)}`, payload));
        }

        // Add some random fake errors 
        if (Math.random() < 0.05) {
            promises.push(ingestionService.processTelemetry('device_err', { wrong: 'payload' })); // Causes syntax error metric to climb
        }
        
        await Promise.all(promises);

        // Sleep shortly to represent time passage
        await new Promise(r => setTimeout(r, 10));
    }

    logger.info('Observability Data Generation Complete', { test_id: 'OBS_001', payload_count: totalPumps });

    // Render the beautiful text dashboard!
    metrics.renderDashboard();
}

runObservabilityMock();
