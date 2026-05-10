const mqtt = require('mqtt');
const config = require('../src/config/mqtt.config');

const DEVICE_ID = 'esp32_c3_env_01';

const simOptions = { ...config.options, clientId: 'sim_' + DEVICE_ID + '_' + Math.random().toString(16).slice(3) };
const client = mqtt.connect(config.url, simOptions);

client.on('connect', () => {
    console.log('[Simulator] Connected to MQTT broker!');
    
    // Subscribe to commands coming from the backend
    client.subscribe('envsense_pbl/command/' + DEVICE_ID, () => {
        console.log('[Simulator] Listening for commands on envsense_pbl/command/' + DEVICE_ID);
    });

    // 1. Send normal reading
    publishReading(800, true);

    // 2. Send 3 high CO2 readings to trigger the Rules Engine ventilation command
    setTimeout(() => publishReading(1200, true), 2000);
    setTimeout(() => publishReading(1300, true), 4000);
    setTimeout(() => publishReading(1100, true), 6000); // This 3rd one triggers the vent
    
    // Exit after script completes
    setTimeout(() => process.exit(0), 8000);
});

client.on('message', (topic, msg) => {
    console.log('\n?? [Simulator] Received Command on ' + topic + ':\n', JSON.parse(msg.toString()), '\n');
});

function publishReading(co2, occupancy) {
    const payload = {
        co2, temp: 24.5, humidity: 45, occupancy, radar_energy: 120
    };
    console.log('[Simulator] Publishing telemetry: CO2=' + co2 + ' ppm');
    client.publish('envsense_pbl/telemetry/' + DEVICE_ID, JSON.stringify(payload));
}
