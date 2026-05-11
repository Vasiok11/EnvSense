const os = require('os');

class MetricsRegistry {
    constructor() {
        this.counters = {};
        this.histograms = {};
        this.gauges = {};
        this.history = {}; // For sparkline graphs
    }

    /**
     * Increment a counter metric
     */
    increment(name, value = 1) {
        this.counters[name] = (this.counters[name] || 0) + value;
        this._recordHistory(name, this.counters[name]);
    }

    /**
     * Set a gauge metric (e.g., active connections, CPU)
     */
    setGauge(name, value) {
        this.gauges[name] = value;
        this._recordHistory(`gauge_${name}`, value);
    }

    /**
     * Observe a value for a histogram (e.g., latency ms)
     */
    observe(name, value) {
        if (!this.histograms[name]) {
            this.histograms[name] = { count: 0, sum: 0, min: value, max: value, values: [] };
        }
        const hist = this.histograms[name];
        hist.count++;
        hist.sum += value;
        hist.min = Math.min(hist.min, value);
        hist.max = Math.max(hist.max, value);
        // Keep last 50 for moving average/graphing
        hist.values.push(value);
        if (hist.values.length > 50) hist.values.shift();
    }

    _recordHistory(name, value) {
        if (!this.history[name]) this.history[name] = [];
        this.history[name].push(value);
        if (this.history[name].length > 20) this.history[name].shift();
    }

    /**
     * Helper to generate ASCII sparklines for graphs
     */
    _sparkline(numbers) {
        if (!numbers || numbers.length === 0) return 'No data';
        const ticks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        const max = Math.max(...numbers);
        const min = Math.min(...numbers);
        
        if (max === min) return ticks[0].repeat(numbers.length);
        
        return numbers.map(n => {
            const tickIndex = Math.round(((n - min) / (max - min)) * 7);
            return ticks[tickIndex];
        }).join('');
    }

    /**
     * Renders a beautiful ASCII Dashboard for observability
     */
    renderDashboard() {
        console.log('\n=============================================================================');
        console.log('                      📊 ENVSENSE SYSTEM OBSERVABILITY                       ');
        console.log('=============================================================================');
        
        // System metrics
        this.setGauge('Memory_Usage_MB', Math.round(process.memoryUsage().rss / 1024 / 1024));
        this.setGauge('System_Load_Avg', os.loadavg()[0]);

        console.log('\n[ SYSTEM GAUGES ]');
        const gaugeTable = Object.entries(this.gauges).map(([key, val]) => ({
            Metric: key.replace(/_/g, ' '),
            Value: val,
            Graph: this._sparkline(this.history[`gauge_${key}`] || [val])
        }));
        console.table(gaugeTable);

        console.log('\n[ EVENT COUNTERS ]');
        const counterTable = Object.entries(this.counters).map(([key, val]) => ({
            Action: key.replace(/_/g, ' '),
            Total: val,
            Trend: this._sparkline(this.history[key] || [val])
        }));
        if (counterTable.length > 0) console.table(counterTable);
        else console.log('  No counters recorded yet.');

        console.log('\n[ PERFORMANCE HISTOGRAMS ]');
        const histTable = Object.entries(this.histograms).map(([key, h]) => ({
            Operation: key,
            Count: h.count,
            'Avg (ms)': (h.sum / h.count).toFixed(2),
            'Min (ms)': h.min.toFixed(2),
            'Max (ms)': h.max.toFixed(2),
            Distribution: this._sparkline(h.values)
        }));
        if (histTable.length > 0) console.table(histTable);
        else console.log('  No histograms recorded yet.');

        console.log('=============================================================================\n');
    }
}

module.exports = new MetricsRegistry();
