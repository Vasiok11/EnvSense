const jwt = require('jsonwebtoken');
const config = require('../../../config/auth.config');

const authGuard = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // Contains id, username, role
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Token expired or invalid' });
    }
};

module.exports = authGuard;