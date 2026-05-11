const assert = require('assert');
const securityUtil = require('../src/utils/securityUtil');
const mockData = require('./mock_data/security_mock_data.json');

function runSecurityTests() {
    console.log('--- Starting Security Hardening Tests ---');
    let passed = 0;
    let failed = 0;

    mockData.devices.forEach((device, index) => {
        try {
            // Test 1: Encryption builds a valid base64 bundle
            const encryptedToken = securityUtil.encrypt(device.plainToken);
            assert.ok(encryptedToken, 'Encrypted token should not be null');
            assert.notStrictEqual(encryptedToken, device.plainToken, 'Encrypted token must differ from plaintext');
            
            // Test 2: Decryption yields original plaintext
            const decryptedToken = securityUtil.decrypt(encryptedToken);
            assert.strictEqual(decryptedToken, device.plainToken, 'Decrypted token must match original plaintext');

            // Test 3: Device SIgnature Generation consistency
            const sig1 = securityUtil.generateDeviceSignature(device.deviceId);
            const sig2 = securityUtil.generateDeviceSignature(device.deviceId);
            assert.strictEqual(sig1, sig2, 'Signature generation should be deterministic');
            assert.ok(sig1.length > 10, 'Signature should be reasonably long');

            console.log(`[PASS] Test ${index + 1}: ${device.description} verified encryption/decryption loop.`);
            passed++;
        } catch (e) {
            console.error(`[FAIL] Test ${index + 1} (${device.description}) failed:`, e.message);
            failed++;
        }
    });

    // Test: Attempting decryption with tampered bundle should throw
    try {
        const encryptedToken = securityUtil.encrypt("tamper_test_string");
        // Tamper with base64 string basically corrupting it
        const tamperedBundle = encryptedToken.substring(0, encryptedToken.length - 5) + "aaaaa";
        
        assert.throws(() => {
            securityUtil.decrypt(tamperedBundle);
        }, /Unsupported state or unable to authenticate data/, 'Should fail auth tag validation');
        
        console.log(`[PASS] Tampered data correctly rejected (AEAD validation passed).`);
        passed++;
    } catch (e) {
        console.error(`[FAIL] Tampering test failed:`, e.message);
        failed++;
    }

    console.log('-----------------------------------------');
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runSecurityTests();
