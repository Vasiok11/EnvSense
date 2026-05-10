const devicePairingRepo = require('../../../repositories/devicePairing.repo');

/**
 * Middleware evaluating if the authenticated user has access to req.params.deviceId
 * Note: Must be placed AFTER authGuard
 */
const deviceAccessGuard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const deviceId = req.params.deviceId;

        if (!deviceId) {
            return res.status(400).json({ error: 'Bad Request: deviceId parameter is missing' });
        }

        const hasAccess = await devicePairingRepo.canUserAccessDevice(userId, deviceId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Forbidden: You do not have access to this device' });
        }

        next();
    } catch (err) {
        console.error('Device Access Guard Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = deviceAccessGuard;