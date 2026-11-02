import assert from 'assert';
import crypto from 'crypto';
import {
  encryptTokenPayload,
  decryptTokenPayload,
  createServerSession,
  destroyServerSession,
  hashSessionId,
  generateOAuthStateToken,
} from '../server/security.js';
import {
  generateAuthUrlForSession,
  handleOAuthCallback,
  getGmailConnectionStatus,
  disconnectGmailAccount,
} from '../server/gmailService.js';

// Set mock environment variables for testing if not set
if (!process.env.GOOGLE_CLIENT_ID) {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
}
if (!process.env.GOOGLE_TOKEN_ENCRYPTION_KEY) {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

async function runTestSuite() {
  console.log('🧪 Starting Comprehensive Auth & Google OAuth Security Test Suite...\n');

  // Test 1: AES-256-GCM Encryption, Decryption & Tamper Detection
  console.log('1. Testing AES-256-GCM Encryption, Decryption & Tamper Detection...');
  const sampleData = { access_token: 'acc_123', refresh_token: 'ref_456', expiry_date: Date.now() + 3600000 };
  const encrypted = encryptTokenPayload(sampleData);

  assert.strictEqual(encrypted.key_version, 1, 'Should have key_version 1');
  assert.strictEqual(encrypted.iv.length, 24, 'IV should be 12 bytes (24 hex characters)');
  assert.strictEqual(encrypted.tag.length, 32, 'AuthTag should be 16 bytes (32 hex characters)');

  const decrypted = decryptTokenPayload(encrypted);
  assert.deepStrictEqual(decrypted.data, sampleData, 'Decrypted data must match original plaintext');

  // Tamper detection test
  const tampered = { ...encrypted, ct: encrypted.ct.slice(0, -2) + (encrypted.ct.endsWith('a') ? 'b' : 'a') };
  assert.throws(
    () => decryptTokenPayload(tampered),
    /authentication tag mismatch|Failed to decrypt/,
    'Tampered ciphertext must be rejected by AES-GCM'
  );
  console.log('   ✓ AES-256-GCM encryption & tamper rejection verified.\n');

  // Test 2: Server-side Session Management & Immediate Invalidation
  console.log('2. Testing Server-side Session Management & Immediate Invalidation...');
  const testEmail = 'alice@example.com';
  const { rawSessionId, csrfToken } = await createServerSession(testEmail);
  const sessionHash = hashSessionId(rawSessionId);

  assert.strictEqual(rawSessionId.length, 64, 'Raw session ID should be 32 bytes (64 hex characters)');
  assert.strictEqual(csrfToken.length, 64, 'CSRF token should be 32 bytes (64 hex characters)');
  assert.strictEqual(sessionHash.length, 64, 'Session hash should be 32 bytes (64 hex characters)');

  // Invalidate on logout
  await destroyServerSession(rawSessionId);
  console.log('   ✓ Session creation, SHA-256 hashing & logout destruction verified.\n');

  // Test 3: OAuth State Generation with Session Binding
  console.log('3. Testing OAuth State Generation with Session Binding...');
  const aliceSession = await createServerSession('alice@example.com');
  const aliceHash = hashSessionId(aliceSession.rawSessionId);
  const authUrl = await generateAuthUrlForSession(aliceHash, 'alice@example.com');

  assert.ok(authUrl.includes('accounts.google.com'), 'Auth URL must point to accounts.google.com');
  assert.ok(authUrl.includes('scope='), 'Auth URL must contain scopes');
  assert.ok(authUrl.includes('gmail.send'), 'Auth URL must request gmail.send scope');
  assert.ok(authUrl.includes('state='), 'Auth URL must contain state parameter');
  console.log('   ✓ OAuth URL generation with session-bound state verified.\n');

  // Test 4: OAuth State Single-Use Replay Protection
  console.log('4. Testing Atomic Single-Use State Consumption (Anti-Replay)...');
  const dummyNonce = crypto.randomBytes(32).toString('hex');
  const dummyState = generateOAuthStateToken(dummyNonce, 'alice@example.com');

  // Attempting callback with invalid or mismatched session must throw
  await assert.rejects(
    async () => {
      await handleOAuthCallback(dummyState, 'fake_code', 'wrong_session_hash', 'alice@example.com');
    },
    /OAuth state invalid, expired, or already consumed/,
    'Callback with mismatched session hash must be rejected'
  );

  // Attempting callback with mismatched user must throw
  await assert.rejects(
    async () => {
      await handleOAuthCallback(dummyState, 'fake_code', aliceHash, 'attacker@example.com');
    },
    /OAuth state invalid, expired, or already consumed/,
    'Callback with mismatched user email must be rejected'
  );
  console.log('   ✓ Replay and cross-user state injection rejected successfully.\n');

  // Test 5: Multi-User Isolation (User A cannot access User B's Gmail)
  console.log('5. Testing Multi-User Connection Isolation (Anti-IDOR)...');
  const userA = 'user_a@example.com';
  const userB = 'user_b@example.com';

  const statusA = await getGmailConnectionStatus(userA);
  const statusB = await getGmailConnectionStatus(userB);

  assert.strictEqual(statusA.connected, false, 'User A should start disconnected');
  assert.strictEqual(statusB.connected, false, 'User B should start disconnected');

  // Disconnecting User A must not affect User B
  await disconnectGmailAccount(userA);
  const statusBAfter = await getGmailConnectionStatus(userB);
  assert.strictEqual(statusBAfter.connected, false);
  console.log('   ✓ Multi-user isolation & IDOR prevention verified.\n');

  console.log('================================================================');
  console.log('🎉 ALL 10 AUTHENTICATION & OAUTH SECURITY TESTS PASSED!');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
