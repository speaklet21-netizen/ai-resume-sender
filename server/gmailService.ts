import { google } from 'googleapis';
import crypto from 'crypto';
import { pool } from './db.js';
import {
  encryptTokenPayload,
  decryptTokenPayload,
  generateOAuthStateToken,
  EncryptedPayload,
} from './security.js';

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://ai-resume-sender.onrender.com/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.');
  }
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

// Local in-memory state and token store fallback for local dev when PostgreSQL is not configured
interface LocalOAuthState {
  stateToken: string;
  sessionHash: string;
  userEmail: string;
  nonce: string;
  expiresAt: number;
  consumed: boolean;
}
const localOAuthStates = new Map<string, LocalOAuthState>();
const localOAuthTokens = new Map<string, { connectedEmail: string; encryptedTokens: EncryptedPayload }>();

// Requirement 1 & 5: Generate OAuth Authorization URL with session-bound, single-use state
export async function generateAuthUrlForSession(sessionHash: string, userEmail: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  const nonce = crypto.randomBytes(32).toString('hex');
  const cleanEmail = userEmail.toLowerCase().trim();
  const stateToken = generateOAuthStateToken(nonce, cleanEmail);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

  if (pool) {
    await pool.query(`
      INSERT INTO oauth_states (state_token, session_hash, user_email, nonce, created_at, expires_at)
      VALUES ($1, $2, $3, $4, NOW(), $5);
    `, [stateToken, sessionHash, cleanEmail, nonce, expiresAt]);
  } else {
    localOAuthStates.set(stateToken, {
      stateToken,
      sessionHash,
      userEmail: cleanEmail,
      nonce,
      expiresAt: expiresAt.getTime(),
      consumed: false,
    });
  }

  // Minimum required scopes: gmail.send and userinfo.email for identity verification
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Forces Google to supply refresh_token
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ],
    state: stateToken,
  });
}

// Requirement 1 & 5: Atomic, single-use state verification and token exchange
export async function handleOAuthCallback(
  stateToken: string,
  code: string,
  sessionHash: string,
  currentUserEmail: string
): Promise<{ connectedEmail: string }> {
  const cleanUserEmail = currentUserEmail.toLowerCase().trim();

  // 1. Atomic state consumption
  if (pool) {
    const { rows } = await pool.query(`
      UPDATE oauth_states
      SET consumed_at = NOW()
      WHERE state_token = $1
        AND session_hash = $2
        AND user_email = $3
        AND consumed_at IS NULL
        AND expires_at > NOW()
      RETURNING state_token;
    `, [stateToken, sessionHash, cleanUserEmail]);

    if (rows.length === 0) {
      throw new Error('OAuth state invalid, expired, or already consumed. Please restart the authorization.');
    }
  } else {
    const localState = localOAuthStates.get(stateToken);
    if (
      !localState ||
      localState.consumed ||
      localState.sessionHash !== sessionHash ||
      localState.userEmail !== cleanUserEmail ||
      localState.expiresAt < Date.now()
    ) {
      throw new Error('OAuth state invalid, expired, or already consumed. Please restart the authorization.');
    }
    localState.consumed = true;
  }

  // 2. Exchange authorization code for tokens
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // 3. Verify granted scopes: ensure gmail.send was actually granted
  const grantedScope = tokens.scope || '';
  if (!grantedScope.includes('https://www.googleapis.com/auth/gmail.send')) {
    throw new Error('Required permission not granted: You must check the box to allow sending emails on your behalf.');
  }

  // 4. Verify Google Identity using trusted Google API endpoint
  const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2Api.userinfo.get();
  const googleEmail = (userInfo.data.email || '').toLowerCase().trim();

  if (!googleEmail) {
    throw new Error('Could not verify Google account email address from identity token.');
  }

  // 5. Cross-user collision prevention: Check if this Gmail address is linked to another user
  if (pool) {
    const { rows: collisionRows } = await pool.query(
      'SELECT user_email FROM google_oauth_tokens WHERE connected_email = $1 AND user_email != $2',
      [googleEmail, cleanUserEmail]
    );
    if (collisionRows.length > 0) {
      throw new Error(`This Gmail account (${googleEmail}) is already linked to another user account.`);
    }
  }

  // 6. Preserve existing refresh token if Google omitted it during reconnection
  let effectiveRefreshToken = tokens.refresh_token;
  if (!effectiveRefreshToken) {
    const existing = await getStoredEncryptedTokens(cleanUserEmail);
    if (existing) {
      try {
        const { data: decrypted } = decryptTokenPayload(existing);
        effectiveRefreshToken = decrypted.refresh_token;
      } catch {}
    }
  }

  if (!effectiveRefreshToken) {
    throw new Error('Google did not return an offline refresh token. Please disconnect and reconnect to grant offline access.');
  }

  const tokenPayloadToStore = {
    access_token: tokens.access_token,
    refresh_token: effectiveRefreshToken,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
    connected_email: googleEmail,
  };

  const encryptedTokens = encryptTokenPayload(tokenPayloadToStore);

  // 7. Store encrypted tokens bound to user account
  if (pool) {
    await pool.query(`
      INSERT INTO google_oauth_tokens (user_email, connected_email, encrypted_tokens, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_email) DO UPDATE
      SET connected_email = EXCLUDED.connected_email,
          encrypted_tokens = EXCLUDED.encrypted_tokens,
          updated_at = NOW();
    `, [cleanUserEmail, googleEmail, JSON.stringify(encryptedTokens)]);
  } else {
    localOAuthTokens.set(cleanUserEmail, {
      connectedEmail: googleEmail,
      encryptedTokens,
    });
  }

  return { connectedEmail: googleEmail };
}

// Retrieve stored encrypted token envelope
async function getStoredEncryptedTokens(userEmail: string): Promise<EncryptedPayload | null> {
  const cleanEmail = userEmail.toLowerCase().trim();
  if (pool) {
    const { rows } = await pool.query(
      'SELECT encrypted_tokens FROM google_oauth_tokens WHERE user_email = $1',
      [cleanEmail]
    );
    if (rows.length > 0) {
      return typeof rows[0].encrypted_tokens === 'string'
        ? JSON.parse(rows[0].encrypted_tokens)
        : rows[0].encrypted_tokens;
    }
    return null;
  } else {
    const item = localOAuthTokens.get(cleanEmail);
    return item ? item.encryptedTokens : null;
  }
}

// Get public Gmail connection status (never exposes secrets or tokens)
export async function getGmailConnectionStatus(userEmail: string): Promise<{ connected: boolean; connectedEmail?: string }> {
  const cleanEmail = userEmail.toLowerCase().trim();
  if (pool) {
    const { rows } = await pool.query(
      'SELECT connected_email FROM google_oauth_tokens WHERE user_email = $1',
      [cleanEmail]
    );
    if (rows.length > 0) {
      return { connected: true, connectedEmail: rows[0].connected_email };
    }
    return { connected: false };
  } else {
    const item = localOAuthTokens.get(cleanEmail);
    if (item) {
      return { connected: true, connectedEmail: item.connectedEmail };
    }
    return { connected: false };
  }
}

// Disconnect Gmail account
export async function disconnectGmailAccount(userEmail: string): Promise<void> {
  const cleanEmail = userEmail.toLowerCase().trim();

  // Attempt token revocation with Google
  try {
    const stored = await getStoredEncryptedTokens(cleanEmail);
    if (stored) {
      const { data } = decryptTokenPayload(stored);
      if (data.refresh_token || data.access_token) {
        const client = getOAuth2Client();
        await client.revokeToken(data.refresh_token || data.access_token);
      }
    }
  } catch (err: any) {
    // Non-blocking revocation failure
    console.warn('[OAUTH] Notice revoking token with Google:', err.message);
  }

  if (pool) {
    await pool.query('DELETE FROM google_oauth_tokens WHERE user_email = $1', [cleanEmail]);
  } else {
    localOAuthTokens.delete(cleanEmail);
  }
}

// Requirement 6: Send application email through Gmail API as the authenticated user
export async function sendGmailApiEmail(
  userEmail: string,
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ delivered: boolean; error?: string; messageId?: string; sentViaGmail: boolean }> {
  const cleanEmail = userEmail.toLowerCase().trim();
  const stored = await getStoredEncryptedTokens(cleanEmail);

  if (!stored) {
    return { delivered: false, sentViaGmail: false, error: 'User has not connected a Gmail account' };
  }

  try {
    const { data: tokenData, needsReencryption } = decryptTokenPayload(stored);

    // If key rotation flagged re-encryption needed, re-encrypt and update DB immediately
    if (needsReencryption && pool) {
      const reencrypted = encryptTokenPayload(tokenData);
      pool.query(
        'UPDATE google_oauth_tokens SET encrypted_tokens = $1 WHERE user_email = $2',
        [JSON.stringify(reencrypted), cleanEmail]
      ).catch(() => {});
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date,
    });

    // Handle token auto-refresh listener to persist new access tokens
    oauth2Client.on('tokens', async (newTokens) => {
      const updated = {
        ...tokenData,
        access_token: newTokens.access_token || tokenData.access_token,
        refresh_token: newTokens.refresh_token || tokenData.refresh_token,
        expiry_date: newTokens.expiry_date || tokenData.expiry_date,
      };
      const reencrypted = encryptTokenPayload(updated);
      if (pool) {
        await pool.query(
          'UPDATE google_oauth_tokens SET encrypted_tokens = $1, updated_at = NOW() WHERE user_email = $2',
          [JSON.stringify(reencrypted), cleanEmail]
        );
      } else {
        const item = localOAuthTokens.get(cleanEmail);
        if (item) item.encryptedTokens = reencrypted;
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const fromAddress = tokenData.connected_email || cleanEmail;

    // Build standard RFC 2822 email format
    const messageParts = [
      `From: <${fromAddress}>`,
      `To: <${toEmail}>`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
    ];

    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      delivered: true,
      sentViaGmail: true,
      messageId: res.data.id || undefined,
    };
  } catch (err: any) {
    console.error(`[GMAIL API ERROR for ${cleanEmail}]:`, err.message);
    return {
      delivered: false,
      sentViaGmail: true,
      error: `Gmail API Error: ${err.message}`,
    };
  }
}
