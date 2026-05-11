const mqtt = require('mqtt');
require('dotenv').config();

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const client = mqtt.connect(brokerUrl);

console.log(`Starting E2E simulation. Connecting to ${brokerUrl}...`);

client.on('connect', async () => {
    console.log('✅ Connected to MQTT broker. Emulating Edge Node fleet...');

    const runSimulationSequence = async () => {
        // [1] Normal Operational Telemetry (Healthy AQI)
        console.log('📡 [1] Emulating normal device telemetry (Healthy AQI)...');
        for (let i = 0; i < 5; i++) {
            client.publish('/telemetry/sim_device_001', JSON.stringify({
                co2: 450 + Math.random() * 50,
                temp: 22.5 + Math.random(),
                humidity: 45 + Math.random(),
                occupancy: false,
                radar_energy: 10
            }));
            await sleep(500); // Wait 500ms between pushes
        }
        
        console.log('⏳ Waiting 2 seconds...');
        await sleep(2000);

        // [2] Spiking CO2 (Triggers Poor/Unhealthy AQI & Rules Engine alert)
        console.log('🔥 [2] Emulating stuffy room with people (Spiking CO2)...');
        for (let i = 0; i < 10; i++) {
            client.publish('/telemetry/sim_device_001', JSON.stringify({
                co2: 1200 + (i * 150), // Rapidly climbing to 2700
                temp: 24.5,
                humidity: 55,
                occupancy: true,
                radar_energy: 85
            }));
            await sleep(500);
        }

        console.log('⏳ Waiting 2 seconds...');
        await sleep(2000);

        // [3] Simulating Network Failure / Last Will & Testament (LWT)
        console.log('💀 [3] Emulating edge node crash / LWT Status...');
        client.publish('/status/sim_device_001', JSON.stringify({
            state: "offline",
            reason: "battery_depleted"
        }));

        console.log('⏳ Waiting 2 seconds...');
        await sleep(2000);

        // [4] Booting up a new sensor and simulating Calibration drift data
        console.log('🔧 [4] Emulating new calibration drift diagnostic...');
        // Let's emulate baseline readings returning ~350 (indicating drift down)
        for (let i = 0; i < 5; i++) {
            client.publish('/telemetry/sim_device_002', JSON.stringify({
                co2: 340 + Math.random() * 15, // Below expected fresh air base (400)
                temp: 21.0,
                humidity: 50,
                occupancy: false,
                radar_energy: 0
            }));
            await sleep(500);
        }

        console.log('✅ Simulation sequence complete. Check your web dashboard (http://localhost:3000)');
        process.exit(0);
    };

    runSimulationSequence();
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
    process.exit(1);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
