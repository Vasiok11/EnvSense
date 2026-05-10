const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repo');
const config = require('../config/auth.config');

class AuthService {
    /**
     * Authenticates a user and generates a JWT
     */
    async login(username, password) {
        const user = await userRepo.findByUsername(username);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Create JWT payload
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn
        });

        return {
            token,
            user: { id: user.id, username: user.username }
        };
    }
}

module.exports = new AuthService();