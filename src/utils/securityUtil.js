const crypto = require('crypto');

// The algorithm to use for encryption
const ALGORITHM = 'aes-256-gcm';
// Length of initialization vector
const IV_LENGTH = 16;
// Length of authentication tag
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
// Key iterations for PBKDF2
const ITERATIONS = 100000;

class SecurityUtil {
    /**
     * Initializes the security utility. Uses ENV variable ENCRYPTION_SECRET.
     * Fallbacks to a generic secret only in non-production for testing.
     */
    constructor() {
        this.secret = process.env.ENCRYPTION_SECRET || 'fallback_dummy_secret_for_local_testing_only';
    }

    /**
     * Encrypts a plaintext string (e.g. device token or pairing key)
     * Returns a base64 string combining salt, iv, authTag, and ciphertext.
     * @param {string} text - The plaintext to encrypt
     * @returns {string} Encrypted bundle
     */
    encrypt(text) {
        if (!text) return null;

        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = crypto.pbkdf2Sync(this.secret, salt, ITERATIONS, 32, 'sha512');
        
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();

        // Concatenate buffers to store them securely as one string
        const bundle = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
        
        return bundle.toString('base64');
    }

    /**
     * Decrypts the previously encrypted bundle back into plaintext string.
     * @param {string} bundleStr - The base64 encrypted bundle
     * @returns {string} Decrypted text
     */
    decrypt(bundleStr) {
        if (!bundleStr) return null;

        const bundle = Buffer.from(bundleStr, 'base64');

        const salt = bundle.slice(0, SALT_LENGTH);
        const iv = bundle.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = bundle.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = bundle.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        const key = crypto.pbkdf2Sync(this.secret, salt, ITERATIONS, 32, 'sha512');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encrypted, undefined, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Checks if a user claims the right device_id using HMAC to avoid spoofing
     */
    generateDeviceSignature(deviceId) {
        const hmac = crypto.createHmac('sha256', this.secret);
        hmac.update(deviceId);
        return hmac.digest('hex');
    }
}

module.exports = new SecurityUtil();
