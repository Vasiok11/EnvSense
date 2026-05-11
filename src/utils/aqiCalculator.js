/**
 * Evaluates Air Quality Index (AQI) based on SCD40 sensor readings.
 * Focuses on CO2 as the primary indicator for indoor environments.
 * Optional: Could incorporate Temperature and Humidity comfort indices.
 */

class AQICalculator {
    /**
     * Calculates a standardized indoor AQI score based on CO2 (ppm)
     * @param {number} co2_ppm 
     * @returns {Object} { score, rating, description }
     */
    static calculateAQI(co2_ppm) {
        if (typeof co2_ppm !== 'number' || co2_ppm < 0) {
            return { score: 0, rating: 'Unknown', description: 'Invalid reading' };
        }

        let score = 0;
        let rating = '';
        let description = '';

        if (co2_ppm <= 800) {
            // Excellent: 400 - 800 ppm
            score = this.interpolate(co2_ppm, 400, 800, 0, 50);
            rating = 'Excellent';
            description = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';
        } else if (co2_ppm <= 1000) {
            // Good: 801 - 1000 ppm
            score = this.interpolate(co2_ppm, 801, 1000, 51, 100);
            rating = 'Good';
            description = 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.';
        } else if (co2_ppm <= 1500) {
            // Moderate: 1001 - 1500 ppm
            score = this.interpolate(co2_ppm, 1001, 1500, 101, 150);
            rating = 'Moderate';
            description = 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.';
        } else if (co2_ppm <= 2000) {
            // Poor: 1501 - 2000 ppm
            score = this.interpolate(co2_ppm, 1501, 2000, 151, 200);
            rating = 'Poor';
            description = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.';
        } else {
            // Unhealthy: > 2000 ppm
            score = this.interpolate(co2_ppm, 2001, 5000, 201, 500); // 500 max cap
            score = Math.min(score, 500); // Cap at 500
            rating = 'Unhealthy';
            description = 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
        }

        return {
            score: Math.round(score),
            rating,
            description
        };
    }

    /**
     * Linear interpolation helper function
     */
    static interpolate(val, cLow, cHigh, iLow, iHigh) {
        return ((iHigh - iLow) / (cHigh - cLow)) * (val - cLow) + iLow;
    }
}

module.exports = AQICalculator;
