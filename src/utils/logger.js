/**
 * Structured Logger
 * Emits JSON formatted logs for Datadog / ELK / Promtail to easily ingest,
 * but falls back to pretty console for local dev.
 */

class Logger {
    constructor() {
        this.isProd = process.env.NODE_ENV === 'production';
    }

    _formatMessage(level, message, meta) {
        const payload = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            ...meta
        };

        if (this.isProd) {
            return JSON.stringify(payload);
        } else {
            // Local dev aesthetic format
            const metaStr = Object.keys(meta).length ? `\n  meta: ${JSON.stringify(meta)}` : '';
            return `[${payload.timestamp}] [${payload.level}] ${payload.message}${metaStr}`;
        }
    }

    info(msg, meta = {}) {
        console.log(this._formatMessage('info', msg, meta));
    }

    warn(msg, meta = {}) {
        console.warn(this._formatMessage('warn', msg, meta));
    }

    error(msg, error = null, meta = {}) {
        if (error) {
            meta.errorMessage = error.message;
            meta.stack = error.stack;
        }
        console.error(this._formatMessage('error', msg, meta));
    }
    
    debug(msg, meta = {}) {
        if (!this.isProd) {
            console.debug(this._formatMessage('debug', msg, meta));
        }
    }
}

module.exports = new Logger();