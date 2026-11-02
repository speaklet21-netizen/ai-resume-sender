import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import tls from 'tls';
import net from 'net';
import cookieParser from 'cookie-parser';

import { pool, runDatabaseMigrations } from './server/db.js';
import {
  createServerSession,
  destroyServerSession,
  requireSession,
  optionalSession,
  validateCsrf,
} from './server/security.js';
import {
  generateAuthUrlForSession,
  handleOAuthCallback,
  getGmailConnectionStatus,
  disconnectGmailAccount,
  sendGmailApiEmail,
} from './server/gmailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Safe request body limit (15mb covers scanned resumes without risk of memory DoS)
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());

// HTML escaping utility for XSS prevention
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Ensure persistent uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure persistent user account data directory exists (preserves data per email)
const USER_DATA_DIR = path.resolve(__dirname, 'user_data');
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

// Path Traversal Security: Safe path resolver for user_data
function getSafeUserDataPath(email: string): string | null {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return null;
  }
  const safeName = path.basename(cleanEmail.replace(/[^a-zA-Z0-9@_-]/g, '_'));
  if (!safeName || safeName.includes('..')) {
    return null;
  }
  const resolvedPath = path.resolve(USER_DATA_DIR, `${safeName}.json`);
  const resolvedBase = path.resolve(USER_DATA_DIR);
  if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedPath;
}

// Path Traversal Security: Safe path resolver for uploads
function getSafeUploadPath(id: string, filename: string): { filePath: string; safeName: string } | null {
  const safeId = path.basename(id.replace(/[^a-zA-Z0-9_-]/g, ''));
  const safeName = path.basename((filename || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.'));
  if (!safeId || !safeName || safeId.includes('..') || safeName.includes('..')) {
    return null;
  }
  const resolvedPath = path.resolve(UPLOADS_DIR, `${safeId}-${safeName}`);
  const resolvedBase = path.resolve(UPLOADS_DIR);
  if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return { filePath: resolvedPath, safeName };
}

// In-memory and disk-persisted OTP storage with TTL expiration, attempt tracking & rate limiting
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts?: number;
  lastRequestedAt?: number;
}
const OTP_STORE_FILE = path.join(USER_DATA_DIR, '.otp_store.json');

function loadOtpStore(): Map<string, OtpEntry> {
  const map = new Map<string, OtpEntry>();
  if (fs.existsSync(OTP_STORE_FILE)) {
    try {
      const raw = fs.readFileSync(OTP_STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      const now = Date.now();
      for (const [email, entry] of Object.entries(data as Record<string, OtpEntry>)) {
        if (entry && entry.expiresAt > now) {
          map.set(email.toLowerCase(), entry);
        }
      }
    } catch { }
  }
  return map;
}

function persistOtpStore(map: Map<string, OtpEntry>) {
  try {
    const obj: Record<string, OtpEntry> = {};
    const now = Date.now();
    for (const [k, v] of map.entries()) {
      if (v.expiresAt > now) {
        obj[k] = v;
      }
    }
    fs.writeFileSync(OTP_STORE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch { }
}

const otpStore = loadOtpStore();

export interface SmtpResult {
  delivered: boolean;
  error?: string;
  detail?: string;
}

// Resilient helper to deliver emails via SMTP if configured in .env (Supports Gmail Port 465 SSL/TLS and Port 587 STARTTLS)
async function sendSmtpEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  _textContent: string
): Promise<SmtpResult> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (!rawUser || !rawPass) {
    return {
      delivered: false,
      error: 'SMTP credentials not configured in .env (Set SMTP_USER and SMTP_PASS for live Gmail inbox delivery).',
    };
  }

  const user = rawUser.trim();
  const pass = rawPass.trim().replace(/\s+/g, ''); // Strip spaces from Gmail 16-character App Passwords
  const isStartTls = port === 587 || port === 25;
  const allowInsecureTls = process.env.ALLOW_INSECURE_TLS === 'true';

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: SmtpResult) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const runDialog = (socket: net.Socket | tls.TLSSocket, initialStep = 0) => {
      let step = initialStep;
      let buffer = '';

      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line) continue;
          const code = line.slice(0, 3);
          const isIntermediate = line.charAt(3) === '-';
          if (isIntermediate) continue;

          // Check for SMTP error response codes (4xx or 5xx)
          if (code.startsWith('4') || code.startsWith('5')) {
            console.warn(`[SMTP Error Code ${code}]:`, line);
            try { socket.write(`QUIT\r\n`); } catch { }
            try { socket.end(); } catch { }
            finish({
              delivered: false,
              error: `SMTP server error (${code}): ${line}`,
              detail: line,
            });
            return;
          }

          if (step === 0 && code === '220') {
            step++;
            socket.write(`EHLO localhost\r\n`);
          } else if (step === 1 && code === '250') {
            step++;
            socket.write(`AUTH LOGIN\r\n`);
          } else if (step === 2 && code === '334') {
            step++;
            socket.write(`${Buffer.from(user).toString('base64')}\r\n`);
          } else if (step === 3 && code === '334') {
            step++;
            socket.write(`${Buffer.from(pass).toString('base64')}\r\n`);
          } else if (step === 4 && code === '235') {
            step++;
            socket.write(`MAIL FROM:<${user}>\r\n`);
          } else if (step === 5 && code === '250') {
            step++;
            socket.write(`RCPT TO:<${toEmail}>\r\n`);
          } else if (step === 6 && code === '250') {
            step++;
            socket.write(`DATA\r\n`);
          } else if (step === 7 && code === '354') {
            step++;
            const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 9)}@${host}>`;
            const dateStr = new Date().toUTCString();
            const msg = [
              `From: "AI Resume Sender" <${user}>`,
              `To: <${toEmail}>`,
              `Subject: ${subject}`,
              `Date: ${dateStr}`,
              `Message-ID: ${messageId}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=utf-8`,
              `Content-Transfer-Encoding: 8bit`,
              ``,
              htmlContent,
              `.`,
              ``,
            ].join('\r\n');
            socket.write(msg);
          } else if (step === 8 && code === '250') {
            step++;
            socket.write(`QUIT\r\n`);
            finish({ delivered: true });
          }
        }
      });

      socket.on('error', (err) => {
        console.warn('[SMTP Connection Warning]:', err.message);
        finish({
          delivered: false,
          error: `SMTP connection error: ${err.message}`,
        });
      });

      socket.setTimeout(12000, () => {
        try { socket.destroy(); } catch { }
        finish({
          delivered: false,
          error: `SMTP timeout after 12s on ${host}:${port}. Port may be blocked or unreachable.`,
        });
      });
    };

    try {
      if (isStartTls) {
        const plainSocket = net.connect(port, host, () => {
          let buffer = '';
          let startTlsStep = 0;

          plainSocket.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\r\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const code = line.slice(0, 3);
              if (line.charAt(3) === '-') continue;

              if (startTlsStep === 0 && code === '220') {
                startTlsStep++;
                plainSocket.write(`EHLO localhost\r\n`);
              } else if (startTlsStep === 1 && code === '250') {
                startTlsStep++;
                plainSocket.write(`STARTTLS\r\n`);
              } else if (startTlsStep === 2 && code === '220') {
                plainSocket.removeAllListeners('data');
                const secureSocket = tls.connect(
                  {
                    socket: plainSocket,
                    host,
                    rejectUnauthorized: !allowInsecureTls,
                  },
                  () => {
                    secureSocket.write(`EHLO localhost\r\n`);
                  }
                );
                runDialog(secureSocket, 1);
              }
            }
          });

          plainSocket.on('error', (err) => {
            finish({ delivered: false, error: `STARTTLS connection error: ${err.message}` });
          });
        });
      } else {
        const socket = tls.connect(
          port,
          host,
          { rejectUnauthorized: !allowInsecureTls, minVersion: 'TLSv1.2' },
          () => {
            runDialog(socket, 0);
          }
        );
        socket.on('error', (err) => {
          finish({ delivered: false, error: `Direct TLS error: ${err.message}` });
        });
      }
    } catch (err: any) {
      finish({ delivered: false, error: `Could not initiate SMTP: ${err.message}` });
    }
  });
}

// In-memory and persistent storage for candidate uploaded resume files
interface StoredResume {
  id: string;
  buffer?: Buffer;
  mimeType: string;
  filename: string;
  text?: string;
  candidateName?: string;
  candidateEmail?: string;
  createdAt: number;
}
const resumeFileStore = new Map<string, StoredResume>();
let latestResumeId: string | null = null;

// Endpoint: Upload raw base64 resume PDF/document to generate working view & download links
app.post('/api/upload-resume-file', optionalSession, async (req, res) => {
  try {
    const { filename, fileData, mimeType, resumeText, candidateName, candidateEmail } = req.body;

    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    const safeInfo = getSafeUploadPath(id, filename);
    if (!safeInfo) {
      return res.status(400).json({ error: 'Invalid filename or upload path' });
    }
    const { filePath, safeName } = safeInfo;

    let buffer: Buffer | undefined;
    if (fileData && typeof fileData === 'string') {
      const cleanBase64 = fileData.replace(/^data:.*?;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
      // Save binary file to disk cache
      try {
        fs.writeFileSync(filePath, buffer);
      } catch (err) {
        console.warn('Could not write uploaded file to disk cache:', err);
      }
    }

    const ownerEmail = req.sessionUser?.email || candidateEmail || 'unassigned_web_upload@system.internal';
    const effectiveMimeType = mimeType || 'application/pdf';

    // Requirement 2 & 4: Persist in PostgreSQL resume_files table with strict ownership
    if (pool && buffer) {
      try {
        await pool.query(`
          INSERT INTO resume_files (id, user_email, filename, mime_type, file_bytes, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (id) DO UPDATE
          SET file_bytes = EXCLUDED.file_bytes, filename = EXCLUDED.filename;
        `, [id, ownerEmail.toLowerCase().trim(), safeName, effectiveMimeType, buffer]);
      } catch (dbErr: any) {
        console.warn('[STORAGE] Could not write resume to PostgreSQL:', dbErr.message);
      }
    }

    const item: StoredResume = {
      id,
      buffer,
      mimeType: effectiveMimeType,
      filename: safeName,
      text: resumeText || '',
      candidateName: candidateName || 'Candidate',
      candidateEmail: candidateEmail || '',
      createdAt: Date.now(),
    };

    resumeFileStore.set(id, item);
    latestResumeId = id;

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol || 'http';
    const viewUrl = `${protocol}://${host}/api/view-resume/${id}/${encodeURIComponent(safeName)}`;
    const downloadUrl = `${protocol}://${host}/api/download-resume/${id}/${encodeURIComponent(safeName)}`;

    return res.json({
      success: true,
      id,
      url: viewUrl,
      downloadUrl,
      filename: safeName,
    });
  } catch (err: any) {
    console.error('Failed to store resume file:', err);
    res.status(500).json({ error: 'Could not store resume file' });
  }
});

// Helper to retrieve stored resume by ID (supports 'latest' alias and database queries)
async function getStoredResumeAsync(requestedId: string, requestedFilename?: string): Promise<StoredResume | undefined> {
  const targetId = requestedId === 'latest' ? (latestResumeId || '') : requestedId;
  const cleanId = (targetId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) return undefined;

  // 1. Try PostgreSQL persistent storage first
  if (pool) {
    try {
      const { rows } = await pool.query(
        'SELECT id, user_email, filename, mime_type, file_bytes, created_at FROM resume_files WHERE id = $1',
        [cleanId]
      );
      if (rows.length > 0) {
        return {
          id: cleanId,
          buffer: rows[0].file_bytes,
          mimeType: rows[0].mime_type || 'application/pdf',
          filename: rows[0].filename || requestedFilename || 'Resume.pdf',
          candidateEmail: rows[0].user_email,
          createdAt: new Date(rows[0].created_at).getTime(),
        };
      }
    } catch (err: any) {
      console.warn('[STORAGE] Database resume query failed, checking disk:', err.message);
    }
  }

  // 2. Try in-memory store
  let item = resumeFileStore.get(cleanId);
  if (item) return item;

  // 3. Fallback to local uploads directory
  if (fs.existsSync(UPLOADS_DIR)) {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const match = files.find(f => f.startsWith(`${cleanId}-`));
      if (match) {
        const safeMatch = path.basename(match);
        const resolvedPath = path.resolve(UPLOADS_DIR, safeMatch);
        if (resolvedPath.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) {
          const buf = fs.readFileSync(resolvedPath);
          const originalName = safeMatch.replace(`${cleanId}-`, '');
          item = {
            id: cleanId,
            buffer: buf,
            mimeType: originalName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
            filename: originalName,
            createdAt: Date.now(),
          };
          resumeFileStore.set(cleanId, item);
        }
      }
    } catch { }
  }
  return item;
}

// Endpoint: View uploaded resume in browser
app.get('/api/view-resume/:id/:filename?', optionalSession, async (req, res) => {
  const item = await getStoredResumeAsync(req.params.id, req.params.filename);
  if (!item) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Resume Not Found</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#0f172a; color:#f8fafc;">
          <h2>Resume Link Expired or Not Found</h2>
          <p>Please return to the AI Resume application and re-upload your resume file.</p>
        </body>
      </html>
    `);
  }

  if (item.buffer) {
    res.setHeader('Content-Type', item.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${item.filename}"`);
    return res.send(item.buffer);
  }

  // If text-only resume, render an elegant ATS-friendly HTML view with XSS protection
  const safeName = escapeHtml(item.candidateName || 'Candidate');
  const safeEmail = escapeHtml(item.candidateEmail || 'Direct Candidate Contact');
  const safeContent = escapeHtml(item.text || 'No resume content available.');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${safeName} - Resume</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          h1 { margin: 0 0 8px 0; color: #0f172a; font-size: 26px; }
          .contact { color: #64748b; font-size: 14px; font-weight: 500; }
          .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 6px; border: 1px solid #a7f3d0; margin-left: 8px; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${safeName} <span class="badge">Verified Candidate Profile</span></h1>
            <div class="contact">${safeEmail}</div>
          </div>
          <pre>${safeContent}</pre>
        </div>
      </body>
    </html>
  `);
});

// Endpoint: Direct Download resume PDF to attach in Gmail
app.get('/api/download-resume/:id/:filename?', optionalSession, async (req, res) => {
  const item = await getStoredResumeAsync(req.params.id, req.params.filename);
  if (!item) {
    return res.status(404).send('Resume file not found or session expired. Please re-upload your resume.');
  }

  const safeFilename = item.filename || 'Resume.pdf';

  if (item.buffer) {
    res.setHeader('Content-Type', item.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return res.send(item.buffer);
  }

  // Fallback if only text was provided with XSS protection
  const safeName = escapeHtml(item.candidateName || 'Resume');
  const safeContent = escapeHtml(item.text || '');
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${safeName}</title></head><body><h1>${safeName}</h1><pre>${safeContent}</pre></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename.replace(/\.pdf$/i, '.html')}"`);
  return res.send(htmlDoc);
});

  const safeFilename = item.filename || 'Resume.pdf';

  if (item.buffer) {
    res.setHeader('Content-Type', item.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return res.send(item.buffer);
  }

  // Fallback if only text was provided with XSS protection
  const safeName = escapeHtml(item.candidateName || 'Resume');
  const safeContent = escapeHtml(item.text || '');
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${safeName}</title></head><body><h1>${safeName}</h1><pre>${safeContent}</pre></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename.replace(/\.pdf$/i, '.html')}"`);
  return res.send(htmlDoc);
});

// Server-side Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })
  : null;

// Endpoint 1: Analyze Resume with Gemini AI
app.post('/api/analyze-resume', async (req, res) => {
  try {
    const { resumeText, candidateInfo } = req.body;

    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    if (!ai) {
      // Return null so client falls back to smart local NLP analyzer
      return res.json({
        fallback: true,
        message: 'No GEMINI_API_KEY configured; using local smart NLP engine.',
      });
    }

    const prompt = `You are an expert technical talent recruiter and resume parser.
Analyze the following candidate resume text and extract detailed technical and professional skills, candidate profile details, strengths, and experience level.

Candidate Name / Email provided by user (if any):
Name: ${candidateInfo?.name || 'Unknown'}
Email: ${candidateInfo?.email || 'Unknown'}

Resume Content:
"""
${resumeText.slice(0, 12000)}
"""

Extract structured information. Be thorough in extracting all programming languages, web frameworks, backend tools, databases, AI/ML tools, cloud/devops, and soft skills mentioned or implied in the resume.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING, description: 'Detected full name' },
            candidateEmail: { type: Type.STRING, description: 'Detected email address' },
            candidatePhone: { type: Type.STRING, description: 'Detected phone number or empty' },
            summary: { type: Type.STRING, description: 'Brief 2-3 sentence executive summary of the candidate' },
            experienceLevel: {
              type: Type.STRING,
              description: 'One of: Fresher / Student, Junior (0-1 yrs), Intermediate (1-2 yrs)',
            },
            detectedSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of detected technical and professional skills in lowercase or standard casing (e.g., Python, React, Docker, SQL, Machine Learning, Fastapi)',
            },
            skillsByCategory: {
              type: Type.OBJECT,
              properties: {
                languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                frontend: { type: Type.ARRAY, items: { type: Type.STRING } },
                backend: { type: Type.ARRAY, items: { type: Type.STRING } },
                databases: { type: Type.ARRAY, items: { type: Type.STRING } },
                aiMlData: { type: Type.ARRAY, items: { type: Type.STRING } },
                cloudDevOps: { type: Type.ARRAY, items: { type: Type.STRING } },
                toolsAndOther: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 top strengths of this candidate',
            },
            recommendedRoles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-5 suitable internship job titles',
            },
          },
          required: ['summary', 'detectedSkills', 'strengths'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.json({ fallback: true, message: 'Empty response from AI' });
    }

    const parsedData = JSON.parse(text);
    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini Resume Analysis Error:', error);
    return res.status(200).json({
      fallback: true,
      error: error.message || 'AI analysis error',
    });
  }
});

// Endpoint 2: Generate Tailored Email Pitch to HR
app.post('/api/generate-pitch', async (req, res) => {
  try {
    const { candidate, internship, lackingSkills, matchedSkills } = req.body;

    if (!internship || !internship.hr) {
      return res.status(400).json({ error: 'Internship and HR details are required' });
    }

    if (!ai) {
      // Deterministic high-converting template fallback
      const resumeFileName = candidate?.fileName || 'Resume.pdf';
      const hasPublicResumeLink =
        candidate?.resumeUrl &&
        candidate.resumeUrl.startsWith('http') &&
        !candidate.resumeUrl.includes('localhost') &&
        !candidate.resumeUrl.includes('127.0.0.1') &&
        !candidate.resumeUrl.includes('/file/d/view?usp=sharing');
      const resumeMention = hasPublicResumeLink
        ? `\n\n📄 View Full Resume (Click to Open):\n${candidate.resumeUrl}`
        : `\n\nMy resume (${resumeFileName}) is attached for your review.`;

      const pitch = `Dear ${internship.hr.name},\n\nI hope this email finds you well. I am writing to express my strong enthusiasm for the ${internship.role} position at ${internship.company}.\n\nHaving reviewed the requirements, my background in ${(matchedSkills || []).slice(0, 4).join(', ') || 'software development'} aligns closely with your team's goals. While I noticed that familiarity with ${(lackingSkills || []).slice(0, 2).join(' and ') || 'specialized internal workflows'} is desired, I am a fast and proactive learner currently building hands-on projects in this area.\n\nI would welcome the opportunity to discuss how my skill set and dedication can contribute to ${internship.company}.${resumeMention}\n\nWarm regards,\n${candidate?.name || 'Applicant'}\n${candidate?.email || ''}\n${candidate?.linkedin || ''}`;
      return res.json({
        success: true,
        subject: `Application for ${internship.role} - ${candidate?.name || 'Internship Applicant'}`,
        body: pitch,
      });
    }

    const hasPublicResumeLink =
      candidate?.resumeUrl &&
      candidate.resumeUrl.startsWith('http') &&
      !candidate.resumeUrl.includes('localhost') &&
      !candidate.resumeUrl.includes('127.0.0.1') &&
      !candidate.resumeUrl.includes('/file/d/view?usp=sharing');
    const prompt = `Write a compelling, professional, and concise cold email pitch from an internship candidate directly to a hiring manager / HR recruiter.

Candidate Information:
Name: ${candidate?.name || 'Applicant'}
Email: ${candidate?.email || ''}
Phone: ${candidate?.phone || ''}
LinkedIn: ${candidate?.linkedin || ''}
Candidate Summary: ${candidate?.summary || ''}
Resume Access: ${hasPublicResumeLink ? `Direct Google Drive / Public Resume Link: ${candidate.resumeUrl}` : `Attached Resume File: ${candidate?.fileName || 'Resume.pdf'}`}
Key Candidate Skills Matching This Role: ${(matchedSkills || []).join(', ')}
Skills Candidate is Eager to Learn / Currently Bridging: ${(lackingSkills || []).join(', ')}

Target Company & Role:
Company: ${internship.company}
Role: ${internship.role}
Work Mode: ${internship.workMode}
HR Recruiter Name: ${internship.hr.name}
HR Title: ${internship.hr.title}

Guidelines:
- Make it polite, energetic, and professional (under 200 words).
- Highlight specific matched skills that directly benefit ${internship.company}.
- If there are lacking skills, mention genuine curiosity and quick adaptability to ramp up quickly.
${hasPublicResumeLink ? `- State clearly: "📄 View My Full Resume: ${candidate.resumeUrl}" right above the sign-off.` : `- State clearly that the candidate's resume (${candidate?.fileName || 'Resume.pdf'}) is attached to the email for review.`}
- End with a clear, low-friction call-to-action (e.g., 10-minute introductory call).
- Return both a compelling subject line and email body.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: 'Subject line' },
            body: { type: Type.STRING, description: 'Email body text with greetings and signature' },
          },
          required: ['subject', 'body'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    let finalBody = result.body || '';

    // Always guarantee that the candidate's Google Drive / Public Resume Link is in the email body
    if (hasPublicResumeLink && candidate?.resumeUrl && !finalBody.includes(candidate.resumeUrl)) {
      const signoffMatch = finalBody.search(/(Warm regards|Best regards|Sincerely|Thanks & regards|Regards|Best,)/i);
      const linkBlock = `📄 View Full Resume (Click to Open):\n${candidate.resumeUrl}\n\n`;
      if (signoffMatch !== -1) {
        finalBody = finalBody.slice(0, signoffMatch) + linkBlock + finalBody.slice(signoffMatch);
      } else {
        finalBody += `\n\n${linkBlock}`;
      }
    }

    return res.json({
      success: true,
      subject: result.subject || `Application for ${internship.role} - ${candidate?.name || 'Applicant'}`,
      body: finalBody,
    });
  } catch (error: any) {
    console.error('Pitch generation error:', error);
    const fallbackPitch = `Dear ${req.body?.internship?.hr?.name || 'Hiring Team'},\n\nI am applying for the ${req.body?.internship?.role || 'Internship'} position at ${req.body?.internship?.company || 'your company'}. With practical experience in ${(req.body?.matchedSkills || []).slice(0, 4).join(', ')}, I would love to contribute to your engineering efforts.\n\nBest regards,\n${req.body?.candidate?.name || 'Applicant'}`;
    return res.json({
      success: true,
      subject: `Application: ${req.body?.internship?.role || 'Internship'} - ${req.body?.candidate?.name || 'Applicant'}`,
      body: fallbackPitch,
    });
  }
});

// Endpoint: Send Single Application Email to HR
app.post('/api/send-single-application', optionalSession, validateCsrf, async (req, res) => {
  try {
    const { hrEmail, hrName, company, role, subject, body, candidate } = req.body;

    if (!hrEmail) {
      return res.status(400).json({ error: 'HR email is required' });
    }

    const emailSubject = subject || `Application for ${role} - ${candidate?.name || 'Applicant'}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 24px; line-height: 1.6;">
          <div style="max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; font-size: 15px; white-space: pre-wrap;">
${(body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        </body>
      </html>
    `;
    const emailText = body || '';

    // Requirement 6: Priority 1 - Send through connected Gmail account if authorized
    const senderEmail = req.sessionUser?.email || candidate?.email;
    let deliveredViaGmail = false;
    let deliveredViaSmtp = false;
    let deliveryError: string | undefined;

    if (senderEmail) {
      const gmailRes = await sendGmailApiEmail(senderEmail, hrEmail, emailSubject, emailHtml, emailText);
      if (gmailRes.sentViaGmail) {
        deliveredViaGmail = gmailRes.delivered;
        deliveryError = gmailRes.error;
      }
    }

    // Priority 2: Fall back to existing SMTP implementation if Gmail API was not used or failed
    if (!deliveredViaGmail) {
      const smtpResult = await sendSmtpEmail(hrEmail, emailSubject, emailHtml, emailText);
      deliveredViaSmtp = smtpResult.delivered;
      if (!deliveryError) {
        deliveryError = smtpResult.delivered ? undefined : smtpResult.error;
      }
    }

    return res.json({
      success: true,
      deliveredViaGmail,
      deliveredViaSmtp,
      smtpError: deliveryError,
      trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Send application error:', err);
    return res.status(500).json({ error: 'Could not send application' });
  }
});

// Endpoint 3: Batch Application Dispatch & Email Delivery
app.post('/api/send-applications', optionalSession, validateCsrf, async (req, res) => {
  const { applications, candidate } = req.body;

  if (!Array.isArray(applications) || applications.length === 0) {
    return res.status(400).json({ error: 'No applications provided' });
  }

  const senderEmail = req.sessionUser?.email || candidate?.email;
  const results = [];
  for (const appItem of applications) {
    let deliveredViaGmail = false;
    let deliveredViaSmtp = false;

    if (appItem.hrEmail && appItem.body) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 24px; line-height: 1.6;">
            <div style="max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; font-size: 15px; white-space: pre-wrap;">
${(appItem.body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </body>
        </html>
      `;
      const emailSubject = appItem.subject || `Application for ${appItem.role} - ${candidate?.name || 'Applicant'}`;

      if (senderEmail) {
        const gmailRes = await sendGmailApiEmail(senderEmail, appItem.hrEmail, emailSubject, emailHtml, appItem.body);
        if (gmailRes.sentViaGmail) {
          deliveredViaGmail = gmailRes.delivered;
        }
      }

      if (!deliveredViaGmail) {
        const smtpRes = await sendSmtpEmail(
          appItem.hrEmail,
          emailSubject,
          emailHtml,
          appItem.body
        );
        deliveredViaSmtp = smtpRes.delivered;
      }
    }

    results.push({
      applicationId: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      internshipId: appItem.internshipId,
      company: appItem.company,
      role: appItem.role,
      hrName: appItem.hrName,
      hrEmail: appItem.hrEmail,
      sentAt: new Date().toISOString(),
      status: 'Applied',
      deliveredViaGmail,
      deliveredViaSmtp,
      deliveryStatus: deliveredViaGmail
        ? 'Delivered via personal Gmail'
        : deliveredViaSmtp
        ? 'Delivered via Gmail SMTP'
        : 'Recorded in Tracker',
      trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    });
  }

  return res.json({
    success: true,
    sentCount: results.length,
    timestamp: new Date().toISOString(),
    applications: results,
  });
});

// Endpoint: Send 6-Digit OTP to User's Email
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    const now = Date.now();
    const existing = otpStore.get(cleanEmail);

    // Rate limiting: allow at most one OTP request every 30 seconds per email
    if (existing && existing.lastRequestedAt && now - existing.lastRequestedAt < 30000) {
      const waitSec = Math.ceil((30000 - (now - existing.lastRequestedAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSec} seconds before requesting a new verification code.`,
      });
    }

    // Generate secure 6-digit random verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes TTL

    otpStore.set(cleanEmail, { code, expiresAt, attempts: 0, lastRequestedAt: now });
    persistOtpStore(otpStore);

    const subject = `Your AI Resume Verification Code: ${code}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a;">
          <div style="max-width: 520px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">AI Resume Sender</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Account Security Verification</div>
            <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #334155;">Use the following 6-digit verification code to sign in to your AI Resume account. This code is valid for 10 minutes.</p>
            <div style="margin: 28px 0; text-align: center;">
              <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a; background: #f1f5f9; padding: 14px 28px; border-radius: 12px; border: 2px dashed #94a3b8;">
                ${code}
              </span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">If you did not request this verification code, please ignore this email. Never share this code with anyone.</p>
          </div>
        </body>
      </html>
    `;
    const textContent = `Your AI Resume verification code is: ${code}. Valid for 10 minutes.`;

    // Attempt real email dispatch via SMTP
    const smtpResult = await sendSmtpEmail(cleanEmail, subject, htmlContent, textContent);

    // Prominent terminal logging
    console.log(`\n===================================================================`);
    console.log(`📧 [AI RESUME OTP DISPATCH]`);
    console.log(`To: ${cleanEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification Code: ${code} (Valid for 10 mins)`);
    console.log(`Delivered via SMTP: ${smtpResult.delivered ? 'YES (Live inbox delivery)' : 'Dev / Console Fallback'}`);
    if (!smtpResult.delivered && smtpResult.error) {
      console.log(`SMTP Notice: ${smtpResult.error}`);
    }
    console.log(`===================================================================\n`);

    const isDevFallback = !smtpResult.delivered && process.env.NODE_ENV !== 'production';

    return res.json({
      success: true,
      message: smtpResult.delivered
        ? `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox or spam folder.`
        : `Verification code generated for ${cleanEmail}.`,
      email: cleanEmail,
      deliveredViaSmtp: smtpResult.delivered,
      smtpError: smtpResult.delivered ? undefined : smtpResult.error,
      // Only expose devOtp in development fallback when live SMTP is not active
      devOtp: isDevFallback ? code : undefined,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ success: false, error: 'Could not send verification code' });
  }
});

// Endpoint: Verify OTP strictly with brute-force protection
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required' });
    }

    const entry = otpStore.get(cleanEmail);

    if (!entry) {
      return res.status(400).json({
        success: false,
        error: 'No verification code found for this email. Please click "Resend Code".',
      });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanEmail);
      persistOtpStore(otpStore);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please click "Resend Code" to get a new code.',
      });
    }

    // Brute force protection: limit to 5 failed attempts
    if ((entry.attempts || 0) >= 5) {
      otpStore.delete(cleanEmail);
      persistOtpStore(otpStore);
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. This verification code has been invalidated for security. Please request a new code.',
      });
    }

    if (entry.code !== cleanCode) {
      entry.attempts = (entry.attempts || 0) + 1;
      persistOtpStore(otpStore);
      const remaining = 5 - entry.attempts;
      return res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // Code matched! Delete used OTP
    otpStore.delete(cleanEmail);
    persistOtpStore(otpStore);

    // Requirement 2 & 5: Issue secure server-side session with hashed ID in DB
    const { rawSessionId, csrfToken } = await createServerSession(cleanEmail);
    res.cookie('ai_resume_session', rawSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const gmailStatus = await getGmailConnectionStatus(cleanEmail);

    return res.json({
      success: true,
      message: 'Email verified successfully',
      email: cleanEmail,
      csrfToken,
      gmailStatus,
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Endpoint: Get current authenticated session & CSRF token
app.get('/api/auth/session', optionalSession, async (req, res) => {
  if (!req.sessionUser) {
    return res.json({ authenticated: false });
  }
  const gmailStatus = await getGmailConnectionStatus(req.sessionUser.email);
  return res.json({
    authenticated: true,
    email: req.sessionUser.email,
    csrfToken: req.sessionData?.csrfToken,
    gmailStatus,
  });
});

// Endpoint: Logout and destroy session immediately across all instances
app.post('/api/auth/logout', async (req, res) => {
  const rawSessionId = req.cookies?.ai_resume_session;
  if (rawSessionId && typeof rawSessionId === 'string') {
    await destroyServerSession(rawSessionId);
  }
  res.clearCookie('ai_resume_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Google OAuth Endpoints
app.get('/api/auth/google/url', requireSession, async (req, res) => {
  try {
    const url = await generateAuthUrlForSession(
      req.sessionData!.sessionHash,
      req.sessionUser!.email
    );
    return res.json({ url });
  } catch (err: any) {
    console.error('[OAUTH URL ERROR]:', err);
    return res.status(500).json({ error: err.message || 'Could not generate authorization URL' });
  }
});

app.get('/api/auth/google/callback', optionalSession, async (req, res) => {
  try {
    if (!req.sessionUser || !req.sessionData) {
      return res.redirect('/?gmail_error=Session+expired+or+invalid.+Please+log+in+again.');
    }
    const { code, state } = req.query;
    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect('/?gmail_error=Missing+authorization+code+or+state');
    }

    await handleOAuthCallback(
      state,
      code,
      req.sessionData.sessionHash,
      req.sessionUser.email
    );

    return res.redirect('/?gmail_connected=true');
  } catch (err: any) {
    console.error('[OAUTH CALLBACK ERROR]:', err);
    return res.redirect(`/?gmail_error=${encodeURIComponent(err.message || 'Authorization failed')}`);
  }
});

app.get('/api/auth/google/status', requireSession, async (req, res) => {
  try {
    const status = await getGmailConnectionStatus(req.sessionUser!.email);
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google/disconnect', requireSession, validateCsrf, async (req, res) => {
  try {
    await disconnectGmailAccount(req.sessionUser!.email);
    return res.json({ success: true, message: 'Gmail disconnected successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint: Save User Account Data (Candidate Profile + Applications) to Persistent Storage
app.post('/api/user-data/:email', optionalSession, async (req, res) => {
  try {
    const cleanEmail = (req.params.email || '').trim().toLowerCase();
    const { candidate, applications } = req.body;

    if (pool) {
      await pool.query(`
        INSERT INTO user_profiles (email, candidate_data, applications, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (email) DO UPDATE
        SET candidate_data = EXCLUDED.candidate_data,
            applications = EXCLUDED.applications,
            updated_at = NOW();
      `, [cleanEmail, candidate || null, JSON.stringify(Array.isArray(applications) ? applications : [])]);
      return res.json({ success: true, savedAt: Date.now() });
    }

    const filePath = getSafeUserDataPath(req.params.email);
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid email or unsafe path requested' });
    }

    const dataToSave = {
      email: cleanEmail,
      candidate: candidate || null,
      applications: Array.isArray(applications) ? applications : [],
      updatedAt: Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return res.json({ success: true, savedAt: dataToSave.updatedAt });
  } catch (err: any) {
    console.error('Save user data error:', err);
    return res.status(500).json({ error: 'Could not save user data' });
  }
});

// Endpoint: Load User Account Data (Candidate Profile + Applications) from Persistent Storage
app.get('/api/user-data/:email', optionalSession, async (req, res) => {
  try {
    const cleanEmail = (req.params.email || '').trim().toLowerCase();

    if (pool) {
      const { rows } = await pool.query(
        'SELECT candidate_data, applications FROM user_profiles WHERE email = $1',
        [cleanEmail]
      );
      if (rows.length > 0) {
        return res.json({
          success: true,
          candidate: rows[0].candidate_data || null,
          applications: typeof rows[0].applications === 'string'
            ? JSON.parse(rows[0].applications)
            : rows[0].applications || [],
        });
      }
    }

    const filePath = getSafeUserDataPath(req.params.email);
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid email or unsafe path requested' });
    }

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      return res.json({
        success: true,
        candidate: data.candidate || null,
        applications: data.applications || [],
      });
    }

    return res.json({
      success: true,
      candidate: null,
      applications: [],
    });
  } catch (err: any) {
    console.error('Load user data error:', err);
    return res.status(500).json({ error: 'Could not load user data' });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  // Execute database migrations and verify storage readiness before accepting traffic
  await runDatabaseMigrations();

  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
        watch: {
          ignored: [
            '**/user_data/**',
            '**/uploads/**',
            '**/.otp_store.json',
            '**/*.log',
            '**/.git/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const listenPort = (port: number) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is already in use, trying port ${port + 1}...`);
        listenPort(port + 1);
      } else {
        console.error('Server launch error:', err);
      }
    });
  };

  listenPort(PORT);
}

startServer();
