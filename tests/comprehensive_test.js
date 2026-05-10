const mqtt = require('mqtt');
const config = require('../src/config/mqtt.config');

const simOptions = { 
    ...config.options, 
    clientId: 'sim_comprehensive_' + Math.random().toString(16).slice(3) 
};
const client = mqtt.connect(config.url, simOptions);

function publish(deviceId, payload) {
    client.publish('envsense_pbl/telemetry/' + deviceId, JSON.stringify(payload));
}

client.on('connect', () => {
    console.log('[Tester] Connected to MQTT broker! Executing 5 Comprehensive Tests...\n');
    
    // Subscribe to all command topics to catch Rules Engine triggers
    client.subscribe('envsense_pbl/command/+');

    // ---------------------------------------------------------
    // TEST 1: Normal Operation (Basic continuous ingestion)
    // ---------------------------------------------------------
    console.log('[Test 1] Launching Normal Operation...');
    for (let i = 1; i <= 3; i++) {
        setTimeout(() => publish('test1_normal', { co2: 600, occupancy: true }), i * 500);
    }

    // ---------------------------------------------------------
    // TEST 2: Rules Engine Fire (Meeting exact thresholds)
    // ---------------------------------------------------------
    console.log('[Test 2] Launching Threshold Trigger (3x High CO2 + Occupancy)...');
    setTimeout(() => publish('test2_trigger', { co2: 1200, occupancy: true }), 1000);
    setTimeout(() => publish('test2_trigger', { co2: 1300, occupancy: true }), 2000);
    setTimeout(() => publish('test2_trigger', { co2: 1100, occupancy: true }), 3000); // Should fire event

    // ---------------------------------------------------------
    // TEST 3: Edge Case -> Cooldown (Spamming high data)
    // ---------------------------------------------------------
    console.log('[Test 3] Launching Cooldown Spam Test (9x High CO2)...');
    // First 3 trigger it. The next 6 will occur within the 15m cooldown, so the event should ONLY fire ONCE.
    for (let i = 1; i <= 9; i++) {
        setTimeout(() => publish('test3_cooldown', { co2: 1500, occupancy: true }), 4000 + (i * 300));
    }

    // ---------------------------------------------------------
    // TEST 4: Stress Test / Concurrency (50 sensors at once)
    // ---------------------------------------------------------
    console.log('[Test 4] Launching Concurrency Stress Test (firing 50 sensors at once)...');
    setTimeout(() => {
        let sent = 0;
        for (let i = 0; i < 50; i++) {
            // Emulate 50 independent meeting rooms connecting simultaneously
            publish(`stress_dev_room_${i}`, { 
                co2: 400 + Math.floor(Math.random() * 500), 
                temp: 24, 
                humidity: 50, 
                occupancy: Math.random() > 0.5 
            });
            sent++;
        }
        console.log(`[Test 4] Dispatched ${sent} simultaneous packets!`);
    }, 2500);

    // ---------------------------------------------------------
    // TEST 5: Edge Case -> Malformed Data / Bad Types
    // ---------------------------------------------------------
    console.log('[Test 5] Launching Malformed / Bad Payload Simulation...');
    setTimeout(() => {
        // Missing CO2 entirely
        publish('test5_bad', { temp: null, occupancy: "yes" }); 
        
        // Strings instead of floats
        publish('test5_bad', { co2: "very high", temp: "hot" }); 
        
        // Complete garbage (Not even JSON)
        client.publish('envsense_pbl/telemetry/test5_bad', "this_is_not_json");
        
        console.log('[Test 5] Fired bad packets. Expected: Backend should warn/drop but NOT crash.');
    }, 3500);

    // Shutdown gracefully
    setTimeout(() => {
        console.log('\n[Tester] All tests delivered. Checking results for 5 seconds...\n');
    }, 8000);

    setTimeout(() => {
        console.log('[Tester] Simulation Complete. Exiting.');
        process.exit(0);
    }, 13000);
});

client.on('message', (topic, msg) => {
    console.log(`\n✅ [Tester] SUCCESS - Intercepted Backend Event on ${topic}:\n`, JSON.parse(msg.toString()), '\n');
});