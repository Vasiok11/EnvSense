require('dotenv').config();
const express = require('express');
const http = require('http');
const mqttClient = require('./infrastructure/mqtt/mqttClient');
const startSubscribers = require('./interfaces/mqtt/subscribers');
const socketServer = require('./infrastructure/websocket/socketServer');

// Routes
const authRoutes = require('./interfaces/http/routes/auth.routes');
const telemetryRoutes = require('./interfaces/http/routes/telemetry.routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Bootstrap application
const bootstrap = async () => {
    try {
        // 1. Connect to MQTT Broker
        const client = await mqttClient.connect();
        
        // 2. Attach MQTT Subscriptions & Handlers
        startSubscribers(client);
        
        // 2.5 Initialize WebSockets
        socketServer.init(server);

        // 3. Start Express HTTP Server
        server.listen(PORT, () => {
            console.log(`🚀 EnvSense Backend listening on port ${PORT}`);
            console.log(`➡️  Health check: http://localhost:${PORT}/health`);
        });

    } catch (error) {
        console.error('Failed to bootstrap EnvSense Backend:', error);
        process.exit(1);
    }
};

bootstrap();