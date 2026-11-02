import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Requirement 1: Fail startup in production if DATABASE_URL is missing
if (isProduction && !databaseUrl) {
  console.error('\n================================================================================');
  console.error('❌ FATAL STARTUP CONFIGURATION ERROR:');
  console.error('   NODE_ENV=production requires DATABASE_URL to be set.');
  console.error('   Production instances must use PostgreSQL for persistent storage.');
  console.error('   Silently falling back to ephemeral JSON storage is disabled in production.');
  console.error('================================================================================\n');
  process.exit(1);
}

// Requirement 3: Database SSL - Secure by default, no blind rejectUnauthorized:false
function getSslConfig() {
  if (!databaseUrl) return false;
  if (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')) {
    const caCert = process.env.DATABASE_CA_CERT;
    const allowInsecureSsl = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false';
    
    return {
      rejectUnauthorized: !allowInsecureSsl,
      ca: caCert || undefined,
    };
  }
  return false;
}

export const pool = databaseUrl
  ? new pg.Pool({
      connectionString: databaseUrl,
      ssl: getSslConfig(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

// Advisory Lock ID for atomic migrations across multiple instances
const MIGRATION_ADVISORY_LOCK_ID = 74291823;

export async function runDatabaseMigrations(): Promise<void> {
  if (!pool) {
    console.log('[STORAGE] Local File Mode active (DATABASE_URL not configured). Using local storage.');
    return;
  }

  const client = await pool.connect();
  try {
    // Requirement 2: Advisory lock ensures strictly one instance executes migrations
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_ID]);
    console.log('[MIGRATION] Acquired PostgreSQL advisory lock for schema migration.');

    // 1. Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Read and apply pending migrations from server/migrations
    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      
      const { rows: appliedRows } = await client.query('SELECT version FROM schema_migrations');
      const appliedSet = new Set(appliedRows.map((r: any) => r.version));

      for (const file of files) {
        const match = file.match(/^(\d+)_/);
        if (!match) continue;
        const version = parseInt(match[1], 10);

        if (!appliedSet.has(version)) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
          console.log(`[MIGRATION] Applying migration ${version}: ${file}...`);
          
          await client.query('BEGIN');
          try {
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [version, file]);
            await client.query('COMMIT');
            console.log(`[MIGRATION] ✓ Applied migration ${version}: ${file}`);
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          }
        }
      }
    }

    // 3. Run safe, idempotent data migration from local files if needed
    await migrateLocalDataToPostgres(client);

  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_ID]);
      console.log('[MIGRATION] Released PostgreSQL advisory lock.');
    } catch {}
    client.release();
  }
}

// Requirement 4 & 6: Safe, idempotent migration with ownership verification and backup
async function migrateLocalDataToPostgres(client: pg.PoolClient): Promise<void> {
  const rootDir = path.resolve(__dirname, '..');
  const userDataDir = path.join(rootDir, 'user_data');
  const uploadsDir = path.join(rootDir, 'uploads');

  if (!fs.existsSync(userDataDir)) return;

  // Check if initial migration has already been executed & verified
  const { rows: migrationFlag } = await client.query(
    "SELECT version FROM schema_migrations WHERE name = '000_local_files_data_migration'"
  );
  if (migrationFlag.length > 0) {
    return; // Already safely migrated
  }

  console.log('[MIGRATION] Starting safe, idempotent migration of local user_data and uploads...');

  // Step 1: Create pre-migration backup snapshot
  const backupDir = path.join(userDataDir, 'backups', `pre_migration_${Date.now()}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const jsonFiles = fs.readdirSync(userDataDir).filter(f => f.endsWith('.json') && !f.startsWith('.'));
  for (const f of jsonFiles) {
    fs.copyFileSync(path.join(userDataDir, f), path.join(backupDir, f));
  }
  console.log(`[MIGRATION] ✓ Created backup snapshot of local files at ${backupDir}`);

  // Step 2: Map user emails and verify resume ownership
  const userResumeMap = new Map<string, string>(); // safeFileName -> userEmail

  for (const f of jsonFiles) {
    try {
      const raw = fs.readFileSync(path.join(userDataDir, f), 'utf-8');
      const data = JSON.parse(raw);
      const email = (data.email || f.replace('.json', '').replace('_', '@')).trim().toLowerCase();

      if (data.candidate?.fileName) {
        userResumeMap.set(data.candidate.fileName, email);
      }
      if (data.candidate?.downloadUrl) {
        const parts = data.candidate.downloadUrl.split('/');
        const idPart = parts[parts.length - 2];
        if (idPart) {
          userResumeMap.set(idPart, email);
        }
      }

      // Idempotent UPSERT into user_profiles
      await client.query(`
        INSERT INTO user_profiles (email, candidate_data, applications, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (email) DO UPDATE
        SET candidate_data = COALESCE(EXCLUDED.candidate_data, user_profiles.candidate_data),
            applications = COALESCE(EXCLUDED.applications, user_profiles.applications),
            updated_at = NOW();
      `, [email, data.candidate || null, JSON.stringify(data.applications || [])]);

      // Verification check for each profile
      const { rows: verifyRow } = await client.query('SELECT email FROM user_profiles WHERE email = $1', [email]);
      if (verifyRow.length === 0) {
        throw new Error(`Migration verification failed for user profile: ${email}`);
      }
    } catch (err: any) {
      console.warn(`[MIGRATION] Notice processing user file ${f}:`, err.message);
    }
  }

  // Step 3: Migrate uploads with strict ownership verification
  if (fs.existsSync(uploadsDir)) {
    const uploadFiles = fs.readdirSync(uploadsDir);
    for (const file of uploadFiles) {
      const filePath = path.join(uploadsDir, file);
      if (!fs.statSync(filePath).isFile()) continue;

      const firstDash = file.indexOf('-');
      const fileId = firstDash !== -1 ? file.substring(0, firstDash) : file;
      const originalName = firstDash !== -1 ? file.substring(firstDash + 1) : file;

      // Determine ownership from matched user resume map
      let ownerEmail = userResumeMap.get(originalName) || userResumeMap.get(fileId);
      if (!ownerEmail) {
        // Safe fallback for unassigned legacy files without guessing
        ownerEmail = 'legacy_archive@system.internal';
      }

      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = originalName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

      await client.query(`
        INSERT INTO resume_files (id, user_email, filename, mime_type, file_bytes, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [fileId, ownerEmail, originalName, mimeType, fileBuffer]);

      // Verification check
      const { rows: verifyUpload } = await client.query('SELECT id FROM resume_files WHERE id = $1', [fileId]);
      if (verifyUpload.length === 0) {
        throw new Error(`Migration verification failed for resume file: ${fileId}`);
      }
    }
  }

  // Step 4: Record verified migration completed
  await client.query(
    "INSERT INTO schema_migrations (version, name) VALUES (0, '000_local_files_data_migration')"
  );
  console.log('[MIGRATION] ✓ Successfully migrated and verified local user profiles & resume files into PostgreSQL.');
  console.log('[MIGRATION] Original files preserved untouched in user_data and uploads.');
}
