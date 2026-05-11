const telemetryService = require('../../../services/telemetry.service');
const telemetryEvents = require('../../../utils/telemetryEvents');

class TelemetryController {
    /**
     * SSE stream for live telemetry updates on the web
     */
    streamTelemetry(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send an initial event to establish connection
        res.write('data: {"status": "connected"}\n\n');

        const telemetryListener = (data) => {
            // Write to SSE
            res.write(`data: ${JSON.stringify({ type: 'telemetry', data })}\n\n`);
        };

        const logListener = (logData) => {
            // Write to SSE
            res.write(`data: ${JSON.stringify({ type: 'log', data: logData })}\n\n`);
        };

        telemetryEvents.on('new_telemetry', telemetryListener);
        telemetryEvents.on('system_log', logListener);

        // When the frontend connection closes, remove listener to avoid memory leak
        req.on('close', () => {
            telemetryEvents.removeListener('new_telemetry', telemetryListener);
            telemetryEvents.removeListener('system_log', logListener);
        });
    }

    async getDeviceTelemetry(req, res) {
        try {
            const { deviceId } = req.params;
            const view = req.query.view || '24h'; // '1h', '24h', '7d'

            const history = await telemetryService.getTelemetryHistory(deviceId, view);

            res.status(200).json({
                deviceId,
                view,
                count: history.length,
                data: history
            });
        } catch (error) {
            console.error('[Telemetry Controller Error]', error);
            res.status(500).json({ error: 'Failed to retrieve telemetry data' });
        }
    }
}

module.exports = new TelemetryController();