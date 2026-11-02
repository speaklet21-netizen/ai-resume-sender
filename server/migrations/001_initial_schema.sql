-- Migration: 001_initial_schema.sql
-- Description: Core tables for session management, OAuth state, encrypted Google tokens, user profiles, and persistent resume binaries.

-- 1. Schema migration tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Server-side session management (Stores SHA-256 hashes of session tokens, not raw IDs)
CREATE TABLE IF NOT EXISTS user_sessions (
  session_hash VARCHAR(64) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  csrf_token VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON user_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- 3. Atomic, single-use, session-bound OAuth states (survives restarts, immune to replay)
CREATE TABLE IF NOT EXISTS oauth_states (
  state_token VARCHAR(128) PRIMARY KEY,
  session_hash VARCHAR(64) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  nonce VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_lookup ON oauth_states(state_token, session_hash, user_email);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- 4. Secure Encrypted Google OAuth Tokens per user
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  user_email VARCHAR(255) PRIMARY KEY,
  connected_email VARCHAR(255) NOT NULL,
  encrypted_tokens JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_google_connected_email ON google_oauth_tokens(connected_email);

-- 5. Persistent User Data (Candidate profiles and job applications)
CREATE TABLE IF NOT EXISTS user_profiles (
  email VARCHAR(255) PRIMARY KEY,
  candidate_data JSONB NULL,
  applications JSONB NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Persistent Resume Files (Bytea storage for PDFs, guaranteed to survive redeploys and restarts)
CREATE TABLE IF NOT EXISTS resume_files (
  id VARCHAR(64) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  file_bytes BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resume_files_user ON resume_files(user_email);
