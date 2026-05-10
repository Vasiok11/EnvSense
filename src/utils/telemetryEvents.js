const EventEmitter = require('events');
class TelemetryEventEmitter extends EventEmitter {}
const telemetryEvents = new TelemetryEventEmitter();

module.exports = telemetryEvents;
