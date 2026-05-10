// Mock Device-to-User Pairing DB
const pairings = [
    {
        deviceId: 'esp32_c3_env_01',
        userId: 'u_12345',
        accessLevel: 'owner'
    }
];

class DevicePairingRepository {
    /**
     * Checks if a user has access to a specific device
     */
    async canUserAccessDevice(userId, deviceId) {
        const pairing = pairings.find(p => p.userId === userId && p.deviceId === deviceId);
        return !!pairing;
    }

    /**
     * Returns all devices a user is authorized to access
     */
    async getUserDevices(userId) {
        return pairings.filter(p => p.userId === userId).map(p => p.deviceId);
    }
}

module.exports = new DevicePairingRepository();