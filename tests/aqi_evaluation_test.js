const AQICalculator = require('../src/utils/aqiCalculator');
const mockData = require('./mock_data/aqi_mock_data.json');
const assert = require('assert');

function runAQITests() {
    console.log('--- Starting AQI Evaluation Tests ---');
    let passed = 0;
    let failed = 0;

    mockData.forEach((testCase, index) => {
        const result = AQICalculator.calculateAQI(testCase.co2);
        
        try {
            assert.strictEqual(result.rating, testCase.expectedRating);
            console.log(`[PASS] Test ${index + 1}: ${testCase.description} (CO2: ${testCase.co2}ppm) -> AQI Score: ${result.score}, Rating: ${result.rating}`);
            passed++;
        } catch (error) {
            console.error(`[FAIL] Test ${index + 1}: ${testCase.description}`);
            console.error(`  Expected: ${testCase.expectedRating}, Got: ${result.rating}`);
            failed++;
        }
    });

    console.log('-------------------------------------');
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

runAQITests();
