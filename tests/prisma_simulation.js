const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runSimulation() {
  console.log('🧪 Starting Prisma End-to-End Database Flow Simulation...\n');

  try {
    // -------------------------------------------------------------
    // Step 0: Clean up previous test runs (Idempotency)
    // -------------------------------------------------------------
    console.log('🧹 Cleaning up old simulation data...');
    // Because of foreign keys, clean Alerts and Thresholds before Devices
    await prisma.alert.deleteMany({ where: { device: { name: { startsWith: 'Simulated' } } } });
    await prisma.deviceRuleThreshold.deleteMany({ where: { device: { name: { startsWith: 'Simulated' } } } });
    await prisma.device.deleteMany({ where: { name: { startsWith: 'Simulated' } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'sim_' } } });
    await prisma.organization.deleteMany({ where: { name: 'Acme IoT Corp (Simulation)' } });
    
    // -------------------------------------------------------------
    // Step 1: Create Organization
    // -------------------------------------------------------------
    console.log('🏢 [1/5] Creating Organization...');
    const org = await prisma.organization.create({
      data: {
        name: 'Acme IoT Corp (Simulation)',
      },
    });
    console.log(`  -> Created Org: ${org.name} (${org.id})`);

    // -------------------------------------------------------------
    // Step 2: Add Users to Organization
    // -------------------------------------------------------------
    console.log('👥 [2/5] Provisioning Users...');
    const admin = await prisma.user.create({
      data: {
        email: 'sim_admin@acme.iot',
        passwordHash: 'dummy_hash_pbkdf2_v1', // Mocked
        role: 'ADMIN',
        organizationId: org.id,
      },
    });

    const viewer = await prisma.user.create({
      data: {
        email: 'sim_viewer@acme.iot',
        passwordHash: 'dummy_hash_pbkdf2_v1', // Mocked
        role: 'VIEWER',
        organizationId: org.id,
      },
    });
    console.log(`  -> Created Admin: ${admin.email}`);
    console.log(`  -> Created Viewer: ${viewer.email}`);

    // -------------------------------------------------------------
    // Step 3: Pair a "Hardware" Device (Mocked ESP32)
    // -------------------------------------------------------------
    console.log('🔌 [3/5] Registering & Pairing Hardware Devices...');
    const device = await prisma.device.create({
      data: {
        hardwareId: `esp32_mac_${Date.now()}`,
        name: 'Simulated Office Air Monitor',
        room: 'Conference Room Alpha',
        status: 'ONLINE',
        pairingToken: 'aes256gcm_encrypted_mock_token_abc123',
        organizationId: org.id,
        // Step 4: Cascade Configuration (Thresholds)
        ruleThresholds: {
          create: {
            maxCo2Ppm: 1200,   // Strict CO2 rule for this room
            maxTemp: 26.5,
            minTemp: 18.0,
          }
        }
      },
      include: {
        ruleThresholds: true
      } // Fetch it back to prove it worked
    });
    console.log(`  -> Device created: [${device.hardwareId}] in ${device.room}`);
    console.log(`  -> Custom Thresholds applied: CO2 max ${device.ruleThresholds.maxCo2Ppm}ppm`);

    // -------------------------------------------------------------
    // Step 4: Mock InfluxDB Telemetry Data Flow -> Rules Engine -> Alert
    // -------------------------------------------------------------
    // Normally: MQTT -> IngestionService -> InfluxDB + RulesEngineService -> Alert
    console.log('🚨 [4/5] Simulating telemetry ingestion & anomaly detection...');
    console.log('  -> (Mock) InfluxDB ingested: { co2: 1450, temp: 24.0, pir: 1 }');
    console.log('  -> (Mock) Rules Engine detects CO2 > 1200ppm threshold!');
    
    const alert = await prisma.alert.create({
      data: {
        deviceId: device.id,
        alertType: 'HVAC_TRIGGER',
        message: 'High CO2 levels detected (1450ppm). Threshold is 1200ppm. Triggering exhaust fans.',
        resolved: false,
      }
    });

    const ghostAlert = await prisma.alert.create({
        data: {
          deviceId: device.id,
          alertType: 'GHOST_MOTION',
          message: 'Radar detected motion but PIR is cold. Cross-checking thermal grid...',
          resolved: true, // Auto-resolved by system
        }
    });
    console.log(`  -> Alert fired: ${alert.alertType} - ${alert.message}`);

    // -------------------------------------------------------------
    // Step 5: Master Relational Query (How it looks on the NOC Dashboard)
    // -------------------------------------------------------------
    console.log('\n📊 [5/5] Executing Complex Relational Dashboard Query...');
    
    const dashboardData = await prisma.organization.findUnique({
      where: { id: org.id },
      include: {
        users: {
          select: { id: true, email: true, role: true }
        },
        devices: {
          include: {
            ruleThresholds: true,
            alerts: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    console.log('\n======================================================');
    console.log('                 DASHBOARD JSON DUMP                  ');
    console.log('======================================================');
    console.dir(dashboardData, { depth: null, colors: true });
    console.log('======================================================\n');
    console.log('✅ Prisma Relational Simulation Complete!');

  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runSimulation();