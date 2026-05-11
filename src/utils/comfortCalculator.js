/**
 * Calculates a Thermal Comfort Index based on Temperature (°C) and Humidity (%).
 */
class ComfortCalculator {
    static calculate(temp_c, humidity_pct) {
        if (typeof temp_c !== 'number' || typeof humidity_pct !== 'number') {
            return { score: 0, rating: 'Unknown', description: 'Invalid reading' };
        }

        let score = 100;
        let rating = 'Optimal';
        let description = 'Perfect thermal comfort.';

        // Rough heuristic for Indoor Thermal Comfort (ASHRAE Standard 55 loosely modeled)
        // Ideal: 20-25°C, 30-60% Rh
        
        // Temperature penalty
        if (temp_c < 18) {
            score -= (18 - temp_c) * 5;
            rating = 'Too Cold';
            description = 'Temperature is below optimal indoor standards.';
        } else if (temp_c > 25) {
            score -= (temp_c - 25) * 5;
            rating = 'Too Hot';
            description = 'Temperature is uncomfortably warm.';
        }

        // Humidity penalty
        if (humidity_pct < 30) {
            score -= (30 - humidity_pct) * 1.5;
            if (rating === 'Optimal') rating = 'Too Dry';
            description = 'Air is dry, may cause skin/eye irritation.';
        } else if (humidity_pct > 60) {
            score -= (humidity_pct - 60) * 1.5;
            if (rating === 'Optimal') rating = 'Too Humid';
            description = 'High humidity, potential for mold or stuffiness.';
        }

        if (score < 50) {
            rating = 'Discomfort Warning';
        }

        return {
            score: Math.max(0, Math.round(score)),
            rating,
            description
        };
    }
}

module.exports = ComfortCalculator;
