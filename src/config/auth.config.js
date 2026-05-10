const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
};