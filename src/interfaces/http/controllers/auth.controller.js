const authService = require('../../../services/auth.service');

class AuthController {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            const result = await authService.login(username, password);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ error: error.message });
            }
            console.error('[Auth Controller Error]', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new AuthController();