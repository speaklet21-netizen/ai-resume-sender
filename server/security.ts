import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db.js';

// Extend Express Request interface to include session user
declare global {
  namespace Express {
    interface Request {
      sessionUser?: { email: string };
      sessionData?: { sessionHash: string; csrfToken: string };
    }
  }
}

// Requirement 4: Cryptographic key separation & startup guards
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_32_bytes_min_length_placeholder_12345';
const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET || 'dev_oauth_state_secret_32_bytes_min_length_12345';
const TOKEN_ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const TOKEN_ENCRYPTION_KEY_OLD = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY_PREVIOUS;

// Strict safety guardrail: Never reuse GOOGLE_CLIENT_SECRET as encryption key
if (process.env.GOOGLE_CLIENT_SECRET && TOKEN_ENCRYPTION_KEY === process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('SECURITY VIOLATION: GOOGLE_TOKEN_ENCRYPTION_KEY cannot equal GOOGLE_CLIENT_SECRET');
}
if (SESSION_SECRET === OAUTH_STATE_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: SESSION_SECRET and OAUTH_STATE_SECRET must be distinct in production');
  }
}

// Convert hex or string key to 32-byte Buffer
function getKeyBuffer(keyStr: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
    return Buffer.from(keyStr, 'hex');
  }
  return crypto.createHash('sha256').update(keyStr).digest();
}

export interface EncryptedPayload {
  key_version: number;
  iv: string;
  tag: string;
  ct: string;
}

// Requirement 4: AES-256-GCM Envelope Encryption with Key Versioning
export function encryptTokenPayload(data: any): EncryptedPayload {
  const activeKey = getKeyBuffer(TOKEN_ENCRYPTION_KEY);
  const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', activeKey, iv);

  const plaintext = JSON.stringify(data);
  let ct = cipher.update(plaintext, 'utf8', 'hex');
  ct += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    key_version: 1,
    iv: iv.toString('hex'),
    tag,
    ct,
  };
}

export function decryptTokenPayload(payload: EncryptedPayload): { data: any; needsReencryption: boolean } {
  let keyToUse = getKeyBuffer(TOKEN_ENCRYPTION_KEY);
  let needsReencryption = false;

  // Key rotation support: Check key_version and fall back to OLD key if necessary
  if (payload.key_version === 0 && TOKEN_ENCRYPTION_KEY_OLD) {
    keyToUse = getKeyBuffer(TOKEN_ENCRYPTION_KEY_OLD);
    needsReencryption = true;
  }

  try {
    const iv = Buffer.from(payload.iv, 'hex');
    const tag = Buffer.from(payload.tag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyToUse, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(payload.ct, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return {
      data: JSON.parse(decrypted),
      needsReencryption,
    };
  } catch (err) {
    // If decryption with primary key fails and OLD key is available, try fallback
    if (!needsReencryption && TOKEN_ENCRYPTION_KEY_OLD) {
      const fallbackKey = getKeyBuffer(TOKEN_ENCRYPTION_KEY_OLD);
      const iv = Buffer.from(payload.iv, 'hex');
      const tag = Buffer.from(payload.tag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', fallbackKey, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(payload.ct, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        data: JSON.parse(decrypted),
        needsReencryption: true,
      };
    }
    throw new Error('Failed to decrypt token payload: authentication tag mismatch or invalid key');
  }
}

// Requirement 5: Hash raw session ID before database lookup
export function hashSessionId(rawId: string): string {
  return crypto.createHash('sha256').update(rawId).digest('hex');
}

// Local in-memory session fallback for local development when PostgreSQL is not configured
interface LocalSessionRecord {
  sessionHash: string;
  userEmail: string;
  csrfToken: string;
  expiresAt: number;
}
const localSessions = new Map<string, LocalSessionRecord>();

export async function createServerSession(userEmail: string): Promise<{ rawSessionId: string; csrfToken: string }> {
  const rawSessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const sessionHash = hashSessionId(rawSessionId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (pool) {
    await pool.query(`
      INSERT INTO user_sessions (session_hash, user_email, csrf_token, created_at, expires_at, last_active_at)
      VALUES ($1, $2, $3, NOW(), $4, NOW())
      ON CONFLICT (session_hash) DO UPDATE
      SET user_email = EXCLUDED.user_email, csrf_token = EXCLUDED.csrf_token, expires_at = EXCLUDED.expires_at;
    `, [sessionHash, userEmail.toLowerCase().trim(), csrfToken, expiresAt]);
  } else {
    localSessions.set(sessionHash, {
      sessionHash,
      userEmail: userEmail.toLowerCase().trim(),
      csrfToken,
      expiresAt: expiresAt.getTime(),
    });
  }

  return { rawSessionId, csrfToken };
}

export async function destroyServerSession(rawSessionId: string): Promise<void> {
  const sessionHash = hashSessionId(rawSessionId);
  if (pool) {
    await pool.query('DELETE FROM user_sessions WHERE session_hash = $1', [sessionHash]);
  } else {
    localSessions.delete(sessionHash);
  }
}

// Requirement 2: Server-side Session Authentication Middleware
export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const rawSessionId = req.cookies?.ai_resume_session;

  if (!rawSessionId || typeof rawSessionId !== 'string') {
    res.status(401).json({ error: 'Unauthorized: Active session required' });
    return;
  }

  const sessionHash = hashSessionId(rawSessionId);

  if (pool) {
    const { rows } = await pool.query(
      'SELECT user_email, csrf_token, expires_at FROM user_sessions WHERE session_hash = $1 AND expires_at > NOW()',
      [sessionHash]
    );

    if (rows.length === 0) {
      res.clearCookie('ai_resume_session');
      res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
      return;
    }

    req.sessionUser = { email: rows[0].user_email };
    req.sessionData = { sessionHash, csrfToken: rows[0].csrf_token };

    // Update last_active_at asynchronously
    pool.query('UPDATE user_sessions SET last_active_at = NOW() WHERE session_hash = $1', [sessionHash]).catch(() => {});
  } else {
    const record = localSessions.get(sessionHash);
    if (!record || record.expiresAt < Date.now()) {
      localSessions.delete(sessionHash);
      res.clearCookie('ai_resume_session');
      res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
      return;
    }

    req.sessionUser = { email: record.userEmail };
    req.sessionData = { sessionHash, csrfToken: record.csrfToken };
  }

  next();
}

// Optional session reader (does not reject if unauthenticated)
export async function optionalSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const rawSessionId = req.cookies?.ai_resume_session;
  if (!rawSessionId || typeof rawSessionId !== 'string') {
    return next();
  }

  const sessionHash = hashSessionId(rawSessionId);
  if (pool) {
    try {
      const { rows } = await pool.query(
        'SELECT user_email, csrf_token FROM user_sessions WHERE session_hash = $1 AND expires_at > NOW()',
        [sessionHash]
      );
      if (rows.length > 0) {
        req.sessionUser = { email: rows[0].user_email };
        req.sessionData = { sessionHash, csrfToken: rows[0].csrf_token };
      }
    } catch {}
  } else {
    const record = localSessions.get(sessionHash);
    if (record && record.expiresAt > Date.now()) {
      req.sessionUser = { email: record.userEmail };
      req.sessionData = { sessionHash, csrfToken: record.csrfToken };
    }
  }

  next();
}

// Requirement 3: CSRF & Strict Origin Validation Middleware
export function validateCsrf(req: Request, res: Response, next: NextFunction): void {
  // Only enforce CSRF on mutating requests
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!mutatingMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  // 1. Origin / Referer Validation
  const origin = req.headers.origin || req.headers.referer;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const allowedOrigins = [
    appUrl.replace(/\/$/, ''),
    'https://ai-resume-sender.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (origin) {
    const matchesAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    if (!matchesAllowed && process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Forbidden: Untrusted request origin' });
      return;
    }
  }

  // 2. CSRF Token Validation for authenticated endpoints
  if (req.sessionData?.csrfToken) {
    const clientCsrfToken = req.headers['x-csrf-token'];
    if (!clientCsrfToken || clientCsrfToken !== req.sessionData.csrfToken) {
      res.status(403).json({ error: 'Forbidden: Invalid or missing CSRF token' });
      return;
    }
  }

  next();
}

// Requirement 1: OAuth State Signing & Hashing
export function generateOAuthStateToken(nonce: string, userEmail: string): string {
  const payload = `${nonce}.${userEmail.toLowerCase().trim()}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}
