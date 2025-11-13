 
/* Simple Express backend for UBU AI Gateway (dev-friendly) */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import axios from 'axios';

dotenv.config();

// Ensure Node process uses Bangkok time by default
process.env.TZ = 'Asia/Bangkok';

const app = express();

// Trust proxy to read x-forwarded-* headers from nginx
app.set('trust proxy', true);

// --- CORS (allow local + dev2 domain) ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://dev2.ubu.ac.th')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    return cb(null, allowedOrigins.includes(origin));
  },
  credentials: true
}));

// Body size limit
app.use(express.json({ limit: '10mb' }));

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const OPENROUTER_TOKEN = process.env.OPENROUTER_TOKEN || '';
const NOTIFY_URL = process.env.NOTIFY_URL || 'https://dev2.ubu.ac.th/api_notify/send_message';
const NOTIFY_SPACE = process.env.NOTIFY_SPACE || '';
const NOTIFY_TOKEN = process.env.NOTIFY_TOKEN || '';
const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';
const GOOGLE_CHAT_API_KEY = process.env.GOOGLE_CHAT_API_KEY || '';
const BASE_URL = process.env.BASE_URL || 'https://dev2.ubu.ac.th';

// simple in-memory cache for public data
const modelsCache = { data: null, ts: 0 };
const MODELS_CACHE_MS = process.env.NODE_ENV === 'production' ? (10 * 60 * 1000) : (10 * 1000);

// Helper: send email via UBU email gateway
async function sendEmail(to, subject, htmlMessage, textMessage) {
  try {
    await axios.post('http://202.28.49.210:8000', {
      to,
      subject,
      text: textMessage,
      html: htmlMessage,
      system: "SWDEV2"
    }, { timeout: 10000 });
    console.log(`✅ ส่งอีเมลเรียบร้อยแล้วถึง ${to}`);
  } catch (error) {
    console.error(`❌ ส่งอีเมลไม่สำเร็จ:`, error?.message || error);
  }
}

// Helper: send notification to Google Chat via UBU notify gateway
async function sendNotifyMessage(message, buttons = null) {
  try {
    if (!NOTIFY_URL || !NOTIFY_SPACE || !NOTIFY_TOKEN) return;
    
    let payload = {
      message,
      space: NOTIFY_SPACE,
      token: NOTIFY_TOKEN,
    };
    
    // If buttons are provided, try different formats that UBU notify gateway might support
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      // Try format 1: simple buttons array
      payload.buttons = buttons;
    }
    
    console.log('📤 Sending notification with payload:', JSON.stringify(payload, null, 2));
    await axios.post(NOTIFY_URL, payload, { timeout: 5000 });
    console.log('✅ Notification sent successfully');
  } catch (e) {
    console.warn('❌ notify failed:', e?.response?.status || '', e?.response?.data || e?.message);
    // If buttons format fails, try sending just the message
    if (buttons && buttons.length > 0) {
      try {
        await axios.post(NOTIFY_URL, {
          message,
          space: NOTIFY_SPACE,
          token: NOTIFY_TOKEN,
        }, { timeout: 5000 });
        console.log('✅ Fallback: Sent notification without buttons');
      } catch (e2) {
        console.warn('❌ Fallback notify also failed:', e2?.message);
      }
    }
  }
}

// Helper: send Google Chat card with interactive buttons
async function sendGoogleChatCard(cardData) {
  try {
    // Try to send via Google Chat API directly if we have space and token
    // Format: https://chat.googleapis.com/v1/spaces/{SPACE}/messages?key={KEY}&token={TOKEN}
    const space = NOTIFY_SPACE || '';
    const apiKey = GOOGLE_CHAT_API_KEY || '';
    const token = NOTIFY_TOKEN || '';
    
    // Build webhook URL
    let webhookUrl = GOOGLE_CHAT_WEBHOOK_URL;
    if (!webhookUrl && space) {
      webhookUrl = `https://chat.googleapis.com/v1/spaces/${space}/messages`;
    }
    
    if (!webhookUrl) {
      console.warn('⚠️ Google Chat webhook URL not configured');
      return false;
    }
    
    // Build query parameters - Google Chat API requires both key and token
    const params = new URLSearchParams();
    if (apiKey) params.append('key', apiKey);
    if (token) params.append('token', token);
    
    // If we don't have both key and token, try to use what we have
    if (!apiKey && !token) {
      console.warn('⚠️ Google Chat API key and token not configured');
      return false;
    }
    
    const url = params.toString() ? `${webhookUrl}?${params.toString()}` : webhookUrl;
    const payload = {
      cards: [cardData]
    };
    
    console.log('📤 Sending Google Chat card to:', url.replace(/token=[^&]+/, 'token=***'));
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(url, payload, { 
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Google Chat card sent successfully:', response.status);
    return true;
  } catch (e) {
    console.warn('❌ Google Chat card failed:', e?.response?.status || '', e?.response?.data || e?.message);
    if (e?.response?.data) {
      console.warn('❌ Error details:', JSON.stringify(e.response.data, null, 2));
    }
    // Try sending via UBU notify gateway as fallback
    try {
      console.log('🔄 Trying to send card via UBU notify gateway...');
      if (NOTIFY_URL && NOTIFY_SPACE && NOTIFY_TOKEN) {
        await axios.post(NOTIFY_URL, {
          message: JSON.stringify(cardData, null, 2),
          space: NOTIFY_SPACE,
          token: NOTIFY_TOKEN,
          cards: [cardData] // Try sending cards in payload
        }, { timeout: 5000 });
        console.log('✅ Sent via UBU notify gateway');
        return true;
      }
    } catch (e2) {
      console.warn('❌ UBU notify gateway also failed:', e2?.message);
    }
    return false;
  }
}

// Helper: fetch real pricing for a model from OpenRouter (per 1M tokens), with cache
async function getModelPricingPerM(modelId) {
  try {
    const now = Date.now();
    // refresh cache if stale or empty
    if (!modelsCache.data || now - modelsCache.ts >= MODELS_CACHE_MS) {
      if (!OPENROUTER_TOKEN) return null;
      const resp = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${OPENROUTER_TOKEN}`,
          'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
          'X-Title': 'UBU AI FLOW'
        }
      });
      const items = Array.isArray(resp.data?.data) ? resp.data.data : [];
      const getPrice = (v) => {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const match = v.match(/[0-9]+(?:\.[0-9]+)?/);
          return match ? Number(match[0]) : null;
        }
        if (typeof v === 'object') {
          if (v.usd !== undefined) return Number(v.usd);
          if (v.USD !== undefined) return Number(v.USD);
          if (v.amount !== undefined) return Number(v.amount);
          for (const key of Object.keys(v)) {
            const nested = getPrice(v[key]);
            if (Number.isFinite(nested)) return Number(nested);
          }
        }
        return null;
      };
      const toPerMillion = (val) => {
        if (!Number.isFinite(val)) return null;
        if (val < 0.001) return val * 1_000_000; // per token -> per 1M
        if (val < 1) return val * 1_000;         // per 1K -> per 1M
        return val;                               // already per 1M
      };
      const models = items.map((m) => {
        const rawIn = getPrice(m?.pricing?.prompt ?? m?.pricing?.input ?? m?.pricing?.prompt_usd_per_m ?? m?.pricing?.input_token);
        const rawOut = getPrice(m?.pricing?.completion ?? m?.pricing?.output ?? m?.pricing?.completion_usd_per_m ?? m?.pricing?.output_token);
        return {
          id: m.id,
          pricing: {
            prompt_usd_per_m: toPerMillion(rawIn),
            completion_usd_per_m: toPerMillion(rawOut)
          }
        };
      });
      modelsCache.data = models;
      modelsCache.ts = now;
    }
    const mId = String(modelId || '').toLowerCase();
    const found = (modelsCache.data || []).find(m => String(m.id || '').toLowerCase() === mId) ||
      (modelsCache.data || []).find(m => mId && String(m.id || '').toLowerCase().includes(mId));
    if (!found) return null;
    const inM = Number(found?.pricing?.prompt_usd_per_m);
    const outM = Number(found?.pricing?.completion_usd_per_m);
    if (!Number.isFinite(inM) || !Number.isFinite(outM)) return null;
    return { inM, outM };
  } catch {
    return null;
  }
}

// --- simple cookie helpers (no external deps) ---
function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.path) parts.push(`Path=${opts.path}`); else parts.push('Path=/');
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  
  // Determine SameSite and Secure based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = opts.isHttps !== undefined ? opts.isHttps : (isProduction || opts.protocol === 'https');
  const isLocalhost = opts.host?.includes('localhost') || opts.host?.includes('127.0.0.1');
  const isDev2 = opts.host?.includes('dev2.ubu.ac.th');
  
  // Production: same-origin different paths - use SameSite=Lax (works and simpler)
  // Localhost dev: cross-origin (different ports) - prefer Lax (widely accepted)
  // Allow override via COOKIE_SAMESITE env var (Lax, None, Strict)
  // If SameSite explicitly provided in opts, use it; otherwise auto-detect
  let sameSite = opts.sameSite;
  if (!sameSite) {
    // Check environment variable first (for testing/override)
    const envSameSite = process.env.COOKIE_SAMESITE;
    if (envSameSite && ['Lax', 'None', 'Strict'].includes(envSameSite)) {
      sameSite = envSameSite;
    } else if (isLocalhost) {
      // Localhost dev - cross-origin (different ports: 3000 vs 4000)
      // Use Lax so browser will accept the cookie without Secure
      sameSite = 'Lax';
    } else {
      // Production (HTTPS): use None to ensure the browser always stores cookie
      sameSite = 'None';
    }
  }
  
  // Add SameSite attribute
  parts.push(`SameSite=${sameSite}`);
  
  // Secure flag: required for SameSite=None (except localhost), optional for Lax with HTTPS
  if (sameSite === 'None' && !isLocalhost) {
    // SameSite=None requires Secure (except for localhost which browser allows without Secure)
    const hasSecure = parts.some(p => p === 'Secure');
    if (!hasSecure) parts.push('Secure');
  } else if (isHttps && !isLocalhost) {
    // Production HTTPS - add Secure for better security (optional for Lax but recommended)
    const hasSecure = parts.some(p => p === 'Secure');
    if (!hasSecure) parts.push('Secure');
  }
  // For localhost with Lax or None, no Secure needed (works fine)
  
  // Domain attribute: Only set if explicitly provided
  // Don't auto-set Domain as it can cause cookie to not be set correctly
  if (opts.domain) {
    parts.push(`Domain=${opts.domain}`);
  }
  const cookieString = parts.join('; ');
  
  // Check if Set-Cookie header already exists (Express might add it from CORS middleware)
  // If it exists, append to it; otherwise set new
  const existingCookies = res.getHeader('Set-Cookie');
  if (existingCookies) {
    // Convert to array if it's a string or single value
    const cookieArray = Array.isArray(existingCookies) ? existingCookies : [existingCookies];
    // Remove any existing cookie with same name
    const filtered = cookieArray.filter(c => !c.startsWith(`${name}=`));
    res.setHeader('Set-Cookie', [...filtered, cookieString]);
  } else {
    res.setHeader('Set-Cookie', cookieString);
  }
  
  // Log cookie settings for debugging
  if (name === 'session' && value) {
    console.log(`🍪 Cookie set: ${name}=${value.substring(0, 20)}...; ${cookieString}`);
    console.log(`   Full cookie header: ${res.getHeader('Set-Cookie')}`);
  }
}
function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(p => {
    const [k, ...rest] = p.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

// --- mock session token (HMAC) ---
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verify(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  if (expected !== sig) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
}

// Database connection (using PostgreSQL)
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.PGUSER || 'ai',
  host: process.env.PGHOST || '202.28.49.204',
  database: process.env.PGDATABASE || 'ai-gateway',
  password: process.env.PGPASSWORD || 'ubu-ai',
  port: process.env.PGPORT || 5433,
});

// Force session time zone for every connection
pool.on('connect', async (client) => {
  try {
    await client.query("SET TIME ZONE 'Asia/Bangkok'");
  } catch (e) {
    console.warn('Failed to set DB time zone:', e?.message || e);
  }
});

// Admin: list all API keys with user info + filters
app.get('/api/admin/keys', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { q = '', department = '' } = req.query || {};
  const client = await pool.connect();
  try {
    const rows = await client.query(`
      SELECT ak.*, u.fullname, u.email, u.faculty, u.department_name
      FROM api_keys ak
      LEFT JOIN users u ON ak.user_id = u.id
      ORDER BY ak.created_at DESC
    `);
    let items = rows.rows;
    if (q) {
      const s = String(q).toLowerCase();
      items = items.filter(r =>
        (r.name || '').toLowerCase().includes(s) ||
        (r.fullname || '').toLowerCase().includes(s) ||
        (r.email || '').toLowerCase().includes(s)
      );
    }
    if (department) {
      items = items.filter(r => (r.faculty || '').toLowerCase() === String(department).toLowerCase());
    }
    res.json({ keys: items });
  } catch (e) {
    console.error('Error admin list keys:', e);
    res.status(500).json({ error: 'Failed to list keys' });
  } finally {
    client.release();
  }
});

// Admin: update key (name, credit_limit, status)
app.patch('/api/admin/keys/:id', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const id = req.params.id;
  const { name, credit_limit, is_active } = req.body || {};
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT * FROM api_keys WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined && name !== null) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    
    if (credit_limit !== undefined && credit_limit !== null) {
      updates.push(`credit_limit = $${paramIndex++}`);
      values.push(Number(credit_limit));
    }
    
    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = timezone('Asia/Bangkok', now())`);
    values.push(id);
    
    const query = `UPDATE api_keys SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await client.query(query, values);
    res.json({ key: result.rows[0] });
  } catch (e) {
    console.error('Error admin update key:', e);
    res.status(500).json({ error: 'Failed to update key' });
  } finally {
    client.release();
  }
});

// Admin: delete key
app.delete('/api/admin/keys/:id', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const id = req.params.id;
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM api_keys WHERE id = $1', [id]);
    return res.json({ success: true, deleted: result.rowCount });
  } catch (e) {
    console.error('Error admin delete key:', e);
    res.status(500).json({ error: 'Failed to delete key' });
  } finally {
    client.release();
  }
});

// Ensure database schema is compatible at runtime (idempotent)
async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        ubuaccount VARCHAR(50) UNIQUE NOT NULL,
        fullname VARCHAR(255) NOT NULL,
        faculty VARCHAR(255),
        department_name VARCHAR(255),
        email VARCHAR(255),
        position VARCHAR(255),
        role VARCHAR(20) DEFAULT 'USER',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS personcode VARCHAR(50);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS level_name VARCHAR(255);`);
    
    // API Key Requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_key_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        api_key_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        student_id VARCHAR(255),
        department VARCHAR(255),
        purpose TEXT,
        expected_usage VARCHAR(100),
        course_name VARCHAR(255),
        other_details TEXT,
        credit_limit DECIMAL(10,2) DEFAULT 10.00,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now()),
        updated_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now())
      );
    `);
    await client.query(`ALTER TABLE api_key_requests ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);`);
    await client.query(`ALTER TABLE api_key_requests ADD COLUMN IF NOT EXISTS other_details TEXT;`);
    
    // API Keys table (for approved keys)
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        request_id INTEGER REFERENCES api_key_requests(id),
        name VARCHAR(255) NOT NULL,
        key_value VARCHAR(255) UNIQUE NOT NULL,
        credit_limit DECIMAL(10,2) DEFAULT 10.00,
        current_spend DECIMAL(10,2) DEFAULT 0.00,
        provider VARCHAR(50) DEFAULT 'local',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now()),
        updated_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now())
      );
    `);
    // Ensure new columns exist for older databases
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS request_id INTEGER REFERENCES api_key_requests(id);`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_value VARCHAR(255) UNIQUE;`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash VARCHAR(255);`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(50) DEFAULT 'local';`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 10.00;`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS current_spend DECIMAL(10,2) DEFAULT 0.00;`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS provider_key_value VARCHAR(255);`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;`);
    
    // Admin settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now()),
        updated_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now())
      );
    `);
    
    // Initialize default settings
    await client.query(`
      INSERT INTO admin_settings (key, value, description)
      VALUES ('auto_disable_inactive_days', '30', 'จำนวนวันที่ API key ไม่ได้ใช้งานก่อนปิดอัตโนมัติ (วัน)')
      ON CONFLICT (key) DO NOTHING;
    `);

    // usage logs - support both legacy and new columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id SERIAL PRIMARY KEY
      );
    `);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS api_key_id INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS key_id INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS provider VARCHAR(50);`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS cost DECIMAL(12,6);`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS tokens_used INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS status_code INTEGER;`);
    // new detailed columns
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS model VARCHAR(255);`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS tokens_input INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS tokens_output INTEGER;`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(12,6);`);
    await client.query(`ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now());`);
    // If legacy column "key" exists, rename to key_value
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='key'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='key_value'
        ) THEN
          ALTER TABLE api_keys RENAME COLUMN "key" TO key_value;
        END IF;
      END $$;
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now())
      );
    `);

    // Ensure created_at/updated_at defaults use Bangkok time for existing tables
    await client.query(`ALTER TABLE api_key_requests ALTER COLUMN created_at SET DEFAULT timezone('Asia/Bangkok', now())`);
    await client.query(`ALTER TABLE api_key_requests ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Bangkok', now())`);
    await client.query(`ALTER TABLE api_keys ALTER COLUMN created_at SET DEFAULT timezone('Asia/Bangkok', now())`);
    await client.query(`ALTER TABLE api_keys ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Bangkok', now())`);
    // API user tokens (for external usage of our gateway)
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_user_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP
      );
    `);

    // Usage logs per API key and model
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id SERIAL PRIMARY KEY,
        key_id INTEGER REFERENCES api_keys(id),
        model VARCHAR(255),
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        cost_usd DECIMAL(12,6) DEFAULT 0,
        created_at TIMESTAMP DEFAULT timezone('Asia/Bangkok', now())
      );
    `);
  } finally {
    client.release();
  }
}

// --- OpenRouter helpers ---
async function orCreateKey(name, limitUSD) {
  if (!OPENROUTER_TOKEN) return null;
  try {
    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/keys',
      { name, limit: Number(limitUSD) },
      { headers: { Authorization: `Bearer ${OPENROUTER_TOKEN}` } }
    );
    // try common shapes
    const value = data?.key?.value || data?.value || data?.key || null;
    const usage = Number(data?.key?.usage || 0);
    const limit = Number(data?.key?.limit || limitUSD || 0);
    return { value, usage, limit };
  } catch (e) {
    if (e.response) {
      console.warn('OpenRouter create key failed:', e.response.status, e.response.data?.message || e.response.data || '');
    } else {
      console.warn('OpenRouter create key failed:', e?.message || e);
    }
    return null;
  }
}

async function orListKeys() {
  if (!OPENROUTER_TOKEN) return [];
  try {
    const { data } = await axios.get('https://openrouter.ai/api/v1/keys', {
      headers: { Authorization: `Bearer ${OPENROUTER_TOKEN}` }
    });
    const items = data?.data || data?.keys || [];
    return items;
  } catch (e) {
    if (e.response) {
      console.warn('OpenRouter list error:', e.response.status, e.response.data?.message || e.response.data || '');
    } else {
      console.warn('OpenRouter list error:', e?.message || e);
    }
    return [];
  }
}

// In-memory api-keys (for local dev)
const apiKeys = new Map(); // id -> { id, name, prefix, key, isActive, spendingLimit, currentSpend }
// --- Auth helpers (session or API token) ---
async function getAuthUser(req) {
  // 1) Try cookie session
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (session?.user) return session.user;
  // 2) Try Bearer token from api_user_tokens
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT ut.*, u.* FROM api_user_tokens ut JOIN users u ON ut.user_id = u.id
         WHERE ut.token_hash = $1 AND ut.is_active = true AND (ut.expires_at IS NULL OR ut.expires_at > NOW())`,
        [hash]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        // update last used
        await client.query('UPDATE api_user_tokens SET last_used_at = NOW() WHERE id = $1', [row.id]);
        return {
          id: row.user_id,
          username: row.ubuaccount || row.username,
          role: row.role || 'USER'
        };
      }
    } finally {
      client.release();
    }
  }
  return null;
}

// ✅ HR API Cache
let hrApiCache = {
    data: null,
    lastFetch: 0,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
};

const getHrData = async () => {
    const now = Date.now();

    // ถ้า cache ยังไม่หมดอายุ ให้ใช้ข้อมูลจาก cache
    if (hrApiCache.data && (now - hrApiCache.lastFetch) < hrApiCache.cacheDuration) {
        console.log('📦 Using cached HR data');
        return hrApiCache.data;
    }

    try {
        // Support both dev and production HR API URLs
        const hrApiUrl = process.env.HR_API_URL || 'https://dev.ubu.ac.th/api_hr/get_person_name';
        console.log('🔄 Fetching fresh HR data from API:', hrApiUrl);
        const response = await axios.get(hrApiUrl);
        hrApiCache.data = response.data;
        hrApiCache.lastFetch = now;
        console.log(`✅ HR data cached: ${response.data.length} records`);
        
        // Log sample record structure for debugging
        if (response.data && response.data.length > 0) {
            console.log('📋 Sample HR record fields:', Object.keys(response.data[0]));
            console.log('📋 Sample HR record (first 3 keys):', 
                Object.fromEntries(Object.entries(response.data[0]).slice(0, 3))
            );
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching HR data:', error.message);
        console.error('   URL attempted:', process.env.HR_API_URL || 'https://dev.ubu.ac.th/api_hr/get_person_name');
        // ถ้า cache เก่ามีอยู่ ให้ใช้ cache เก่า
        if (hrApiCache.data) {
            console.log('⚠️ Using stale HR cache due to API error');
            return hrApiCache.data;
        }
        throw error;
    }
};

// HR Data fetch function (using real HR API with cache)
async function fetchHrData(username) {
  console.log(`🔍 Fetching HR data for: ${username}`);
  
  try {
    // Get HR data from cache or API
    const hrDataList = await getHrData();
    
    if (!hrDataList || !Array.isArray(hrDataList)) {
      console.log('❌ HR data is not an array:', typeof hrDataList);
      return null;
    }
    
    // Find user in HR data - search by ubuaccount or email
    const userData = hrDataList.find(user => {
      const userAccount = user.ubuaccount || user.account || user.username || '';
      const userEmail = user.email || '';
      const normalizedUsername = username.toLowerCase();
      return userAccount.toLowerCase() === normalizedUsername || 
             userEmail.toLowerCase() === normalizedUsername ||
             userEmail.toLowerCase() === `${normalizedUsername}@ubu.ac.th`;
    });
    
    if (!userData) {
      console.log(`❌ User ${username} not found in HR system (searched ${hrDataList.length} records)`);
      // Log sample record to see structure
      if (hrDataList.length > 0) {
        console.log('📋 Sample HR record structure:', Object.keys(hrDataList[0]));
      }
      return null;
    }
    
    console.log(`✅ Found HR data for ${username}:`, {
      faculty: userData.faculty || userData.faculty_name,
      department: userData.department_name || userData.department,
      allFields: Object.keys(userData),
      rawData: userData // Log full record for debugging
    });
    
    // Map HR data to our expected format - check multiple possible field names
    const mappedHr = {
      ubuaccount: userData.ubuaccount || userData.account || userData.username || username,
      prefix_name: userData.prefix_name || userData.prefix || 'นาย',
      fname: userData.fname || userData.firstName || userData.first_name || '',
      lname: userData.lname || userData.lastName || userData.last_name || '',
      faculty: userData.faculty || userData.faculty_name || userData.facultyName || '',
      department_name: userData.department_name || userData.department || userData.departmentName || '',
      email: userData.email || `${username}@ubu.ac.th`,
      position: userData.positiontype_name || userData.position || userData.positionName || '',
      status: 'active',
      personcode: userData.personcode || userData.person_code || userData.personCode || '',
      level_name: userData.level_name || userData.levelName || ''
    };
    
    console.log(`📦 Mapped HR data for ${username}:`, {
      faculty: mappedHr.faculty,
      department_name: mappedHr.department_name,
      hasFaculty: !!mappedHr.faculty,
      hasDepartment: !!mappedHr.department_name
    });
    
    return mappedHr;
    
  } catch (error) {
    console.error('❌ Error fetching HR data:', error.message);
    
    // Fallback to mock data if HR API fails
    console.log('⚠️ Using fallback mock data');
    return {
      ubuaccount: username,
      prefix_name: 'นาย',
      fname: 'ทดสอบ',
      lname: 'ระบบ',
      faculty: 'วิศวกรรมศาสตร์',
      department_name: 'คอมพิวเตอร์',
      email: `${username}@ubu.ac.th`,
      position: 'อาจารย์',
      status: 'active'
    };
  }
}

// Create or update user in database
async function createOrUpdateUser(userData) {
  const client = await pool.connect();
  try {
    const {
      ubuaccount,
      personcode,
      prefix_name,
      fname,
      lname,
      faculty,
      department_name,
      email,
      position,
      level_name,
      status = 'active'
    } = userData;

    const fullname = `${prefix_name}${fname} ${lname}`;
    
    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE ubuaccount = $1',
      [ubuaccount]
    );

    let user;
    if (existingUser.rows.length > 0) {
      // Update existing user
      const result = await client.query(`
        UPDATE users 
        SET personcode = $2, fullname = $3, faculty = $4, department_name = $5, 
            email = $6, position = $7, level_name = $8, status = $9, updated_at = NOW()
        WHERE ubuaccount = $1
        RETURNING *
      `, [ubuaccount, personcode, fullname, faculty, department_name, email, position, level_name, status]);
      
      user = result.rows[0];
      console.log('👤 User updated in database');
    } else {
      // Create new user
      const result = await client.query(`
        INSERT INTO users (ubuaccount, personcode, fullname, faculty, department_name, email, position, level_name, status, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'USER', NOW(), NOW())
        RETURNING *
      `, [ubuaccount, personcode, fullname, faculty, department_name, email, position, level_name, status]);
      
      user = result.rows[0];
      console.log('👤 New user created in database');
    }

    return {
      id: user.id,
      username: user.ubuaccount,
      personcode: user.personcode,
      fullname: user.fullname,
      faculty: user.faculty,
      department: user.department_name,
      email: user.email,
      position: user.position,
      level_name: user.level_name,
      role: user.role,
      status: user.status
    };
  } finally {
    client.release();
  }
}

// --- Housekeeping: remove stale pending API key requests (older than 15 days) ---
async function cleanupOldPendingRequests() {
  const client = await pool.connect();
  try {
    await client.query(
      "DELETE FROM api_key_requests WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 days'"
    );
  } finally {
    client.release();
  }
}

// Health check
app.get('/health', (_req, res) => {
  console.log('✅ Health check requested');
  res.json({ ok: true, name: 'UBU AI Gateway Backend', time: new Date().toISOString() });
});

// Optional: accept POST to /health for playground testing
app.post('/health', (_req, res) => {
  console.log('✅ Health check (POST) requested');
  res.json({ ok: true, method: 'POST', name: 'UBU AI Gateway Backend', time: new Date().toISOString() });
});

// Generic echo endpoint for POST testing from API Playground
app.post('/api/echo', (req, res) => {
  res.json({ ok: true, echo: req.body || null, time: new Date().toISOString() });
});

// Public models list (proxied from OpenRouter) - cached for 10 minutes
app.get('/api/models', async (_req, res) => {
  try {
    const now = Date.now();
    if (modelsCache.data && now - modelsCache.ts < MODELS_CACHE_MS) {
      return res.json({ models: modelsCache.data });
    }
    if (!OPENROUTER_TOKEN) {
      return res.status(200).json({ models: [] });
    }
    const resp = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${OPENROUTER_TOKEN}`,
        'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
        'X-Title': 'UBU AI FLOW'
      }
    });
    const items = Array.isArray(resp.data?.data) ? resp.data.data : [];

    const getPrice = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const match = v.match(/[0-9]+(?:\.[0-9]+)?/);
        return match ? Number(match[0]) : null;
      }
      if (typeof v === 'object') {
        // Common shapes: { usd: 0.075 }, { USD: 0.075 }, { amount: 0.075 }
        if (v.usd !== undefined) return Number(v.usd);
        if (v.USD !== undefined) return Number(v.USD);
        if (v.amount !== undefined) return Number(v.amount);
        // Fallback: search recursively for the first finite number
        for (const key of Object.keys(v)) {
          const nested = getPrice(v[key]);
          if (Number.isFinite(nested)) return Number(nested);
        }
      }
      return null;
    };

    const toPerMillion = (val) => {
      if (!Number.isFinite(val)) return null;
      // Heuristics: if value is very small, assume per token; if small (<1), assume per 1K; otherwise already per 1M
      if (val < 0.001) return val * 1_000_000;    // per token -> per 1M
      if (val < 1) return val * 1_000;            // per 1K -> per 1M
      return val;                                  // already per 1M
    };

    const models = items.map((m) => {
      const rawIn = getPrice(m?.pricing?.prompt ?? m?.pricing?.input ?? m?.pricing?.prompt_usd_per_m ?? m?.pricing?.input_token);
      const rawOut = getPrice(m?.pricing?.completion ?? m?.pricing?.output ?? m?.pricing?.completion_usd_per_m ?? m?.pricing?.output_token);
      const pIn = toPerMillion(rawIn);
      const pOut = toPerMillion(rawOut);
      const fmt = (n) => (n === null ? '—' : `$${Number(n).toFixed(3)}/M`);
      return {
      id: m.id,
      name: m.name || m.id,
      description: m.description || m?.meta?.description || null,
        pricing: {
          prompt_usd_per_m: pIn,
          completion_usd_per_m: pOut,
          prompt_display: fmt(pIn),
          completion_display: fmt(pOut),
        },
      context_length: m.context_length || m.context || null,
      by: m?.created_by || m?.owned_by || null,
      modalities: m?.modalities || m?.input_modalities || null,
      url: `https://openrouter.ai/models/${encodeURIComponent(m.id)}`
      };
    });
    modelsCache.data = models;
    modelsCache.ts = now;
    res.json({ models });
  } catch (e) {
    console.warn('Failed to fetch models from OpenRouter:', e?.response?.status, e?.response?.data?.error || e?.message);
    res.json({ models: [] });
  }
});

// --- System status endpoint ---
app.get('/api/status', async (_req, res) => {
  const start = Date.now();
  const results = [];
  // Gateway is alive
  results.push({ id: 'gateway', name: 'API Gateway', status: 'operational', latencyMs: 0 });
  // Database check
  let dbLatency = null; let dbStatus = 'down';
  try {
    const t0 = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbLatency = Date.now() - t0;
    dbStatus = 'operational';
  } catch (e) {
    dbLatency = null;
    dbStatus = 'down';
  }
  results.push({ id: 'database', name: 'Database', status: dbStatus, latencyMs: dbLatency });

  // OpenRouter check (optional)
  let orLatency = null; let orStatus = 'down';
  if (OPENROUTER_TOKEN) {
    try {
      const t0 = Date.now();
      await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${OPENROUTER_TOKEN}`,
          'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
          'X-Title': 'UBU AI FLOW'
        },
        timeout: 7000
      });
      orLatency = Date.now() - t0;
      orStatus = 'operational';
    } catch (e) {
      orStatus = 'down';
    }
  }
  results.push({ id: 'openrouter', name: 'OpenRouter', status: orStatus, latencyMs: orLatency });

  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    uptimeMs: process.uptime() * 1000,
    services: results,
    latencyTotalMs: Date.now() - start
  });
});

// --- Admin usage overview ---
app.get('/api/admin/usage', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { q: searchQuery = '', faculty: filterFaculty = '' } = req.query || {};
  const client = await pool.connect();
  try {
    // Build WHERE conditions for filtering
    const whereConditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (searchQuery) {
      const search = String(searchQuery).toLowerCase();
      whereConditions.push(`(LOWER(u.fullname) LIKE $${paramIndex++} OR LOWER(u.email) LIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (filterFaculty) {
      whereConditions.push(`LOWER(COALESCE(u.faculty, '')) = LOWER($${paramIndex++})`);
      params.push(String(filterFaculty));
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get users with API keys first
    const baseQuery = `
      SELECT DISTINCT u.id, u.fullname, u.faculty, u.email
      FROM users u
      INNER JOIN api_keys ak ON ak.user_id = u.id
      ${whereClause}
    `;
    
    const baseResult = await client.query(baseQuery, params);
    const users = baseResult.rows;
    
    if (users.length === 0) {
      return res.json({ items: [] });
    }
    
    // Get usage stats for each user
    const items = await Promise.all(users.map(async (user) => {
      // Get all keys for this user
      const keysResult = await client.query(`
        SELECT id, name
        FROM api_keys
        WHERE user_id = $1
      `, [user.id]);
      
      const keys = keysResult.rows;
      const keyIds = keys.map(k => k.id);
      
      if (keyIds.length === 0) {
        return null;
      }
      
      // Get total usage for all keys of this user
      // Handle both api_key_id and key_id columns
      let totalCost = 0;
      if (keyIds.length > 0) {
        try {
          // Build IN clause for keyIds
          const placeholders = keyIds.map((_, i) => `$${i + 1}`).join(', ');
          const usageQuery = `
            SELECT COALESCE(SUM(cost_usd), 0) as total_cost
            FROM api_usage_logs
            WHERE api_key_id IN (${placeholders}) OR key_id IN (${placeholders})
          `;
          const usageResult = await client.query(usageQuery, [...keyIds, ...keyIds]);
          totalCost = Number(usageResult.rows[0]?.total_cost || 0);
        } catch (usageError) {
          console.error('Error calculating usage for user', user.id, ':', usageError?.message || usageError);
          totalCost = 0;
        }
      }
      
      return {
        id: user.id,
        label: user.fullname,
        faculty: user.faculty || '-',
        email: user.email,
        total_spend: totalCost,
        keys_count: keys.length,
        key_ids: keyIds,
        key_names: keys.map(k => k.name)
      };
    }));
    
    const filteredItems = items.filter(item => item !== null);
    const sortedItems = filteredItems.sort((a, b) => b.total_spend - a.total_spend);
    
    console.log('🔍 [admin/usage] Found users:', users.length);
    console.log('🔍 [admin/usage] Result items:', sortedItems.length);
    
    return res.json({ items: sortedItems });
  } catch (e) {
    console.error('usage overview error', e?.message || e);
    res.status(500).json({ error: 'failed_to_query_usage' });
  } finally {
    client.release();
  }
});

// Usage per key (by model, with optional date range)
app.get('/api/keys/:id/usage', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const idParam = String(req.params.id || '').trim();
  const keyIdNum = Number(idParam);
  const { start, end } = req.query || {};
  const client = await pool.connect();
  try {
    // Build dynamic match condition (by id or key_value/last8) and enforce ownership
    const matchSql = Number.isFinite(keyIdNum)
      ? 'ak.id = $1'
      : '(ak.key_value = $1 OR right(ak.key_value, 8) = right($1, 8))';
    const cond = [];
    const params = [Number.isFinite(keyIdNum) ? keyIdNum : idParam, session.user.id];
    let idx = 3;
    if (start) { cond.push(`aul.created_at >= $${idx++}`); params.push(new Date(String(start))); }
    if (end)   { cond.push(`aul.created_at <  $${idx++}`); params.push(new Date(String(end))); }
    const extra = cond.length ? `AND ${cond.join(' AND ')}` : '';
    // Aggregate with join - ensures only user's key is visible
    const q = await client.query(`
      SELECT aul.model, COUNT(*) as calls,
             COALESCE(SUM(aul.tokens_input),0) as tokens_in,
             COALESCE(SUM(aul.tokens_output),0) as tokens_out,
             COALESCE(SUM(aul.cost_usd),0) as cost_usd
      FROM api_usage_logs aul
      JOIN api_keys ak ON ak.id = aul.key_id
      WHERE ${matchSql} AND ak.user_id = $2 ${extra}
      GROUP BY aul.model
      ORDER BY cost_usd DESC
    `, params);
    const total = await client.query(`
      SELECT COALESCE(SUM(aul.cost_usd),0) as cost_usd,
             COALESCE(SUM(aul.tokens_input),0) as tokens_in,
             COALESCE(SUM(aul.tokens_output),0) as tokens_out
      FROM api_usage_logs aul
      JOIN api_keys ak ON ak.id = aul.key_id
      WHERE ${matchSql} AND ak.user_id = $2 ${extra}
    `, params);
    res.json({ by_model: q.rows, total: total.rows[0] || { cost_usd: 0, tokens_in: 0, tokens_out: 0 } });
  } catch (e) {
    console.error('key usage error', e?.message || e);
    res.status(500).json({ error: 'failed_to_query_usage' });
  } finally {
    client.release();
  }
});

// Admin: Get usage details for a specific user (all their API keys)
app.get('/api/admin/usage/user/:userId', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const userId = Number(req.params.userId);
  const { start, end } = req.query || {};
  const client = await pool.connect();
  try {
    // Get all API keys for this user
    const keysResult = await client.query(`
      SELECT id, name, key_value, created_at, credit_limit, is_active
      FROM api_keys
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    
    const keys = keysResult.rows;
    console.log('🔍 [admin/usage/user] Found keys for user', userId, ':', keys.length);
    if (keys.length > 0) {
      console.log('🔍 [admin/usage/user] Key IDs:', keys.map(k => k.id));
      console.log('🔍 [admin/usage/user] Key names:', keys.map(k => k.name));
    }
    
    // Get usage per key
    const keysWithUsage = await Promise.all(keys.map(async (key) => {
      try {
        // Build date conditions with proper parameter indices
        const dateCond = [];
        const params = [key.id]; // $1 for key.id (used in both api_key_id and key_id checks)
        let paramIdx = 2;
        
        if (start) {
          dateCond.push(`aul.created_at >= $${paramIdx++}`);
          params.push(new Date(String(start)));
        }
        if (end) {
          dateCond.push(`aul.created_at < $${paramIdx++}`);
          params.push(new Date(String(end)));
        }
        const dateWhere = dateCond.length ? `AND ${dateCond.join(' AND ')}` : '';
        
        // Get usage by model for this key
        // Check both api_key_id and key_id columns (data might be in either)
        const usageQuery = `
          SELECT aul.model, COUNT(*) as calls,
                 COALESCE(SUM(aul.tokens_input),0) as tokens_in,
                 COALESCE(SUM(aul.tokens_output),0) as tokens_out,
                 COALESCE(SUM(aul.cost_usd),0) as cost_usd
          FROM api_usage_logs aul
          WHERE (aul.api_key_id = $1 OR aul.key_id = $1) ${dateWhere}
          GROUP BY aul.model
          ORDER BY cost_usd DESC
        `;
        console.log('🔍 [admin/usage/user] Query for key', key.id, ':', usageQuery);
        console.log('🔍 [admin/usage/user] Params:', params);
        
        // First, check if there are any usage logs for this key at all
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM api_usage_logs aul
          WHERE (aul.api_key_id = $1 OR aul.key_id = $1) ${dateWhere}
        `;
        const checkResult = await client.query(checkQuery, params);
        console.log('🔍 [admin/usage/user] Total usage logs for key', key.id, ':', checkResult.rows[0]?.count || 0);
        
        // Also check what columns exist
        const colCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'api_usage_logs' 
          AND column_name IN ('api_key_id', 'key_id')
        `);
        console.log('🔍 [admin/usage/user] Available columns:', colCheck.rows.map(r => r.column_name));
        
        const byModel = await client.query(usageQuery, params);
        console.log('🔍 [admin/usage/user] By model result for key', key.id, ':', byModel.rows.length, 'rows');
        if (byModel.rows.length > 0) {
          console.log('🔍 [admin/usage/user] Sample row:', byModel.rows[0]);
        } else {
          console.log('⚠️ [admin/usage/user] No usage data found for key', key.id);
        }
        
        // Get total usage for this key (reuse params)
        const totalQuery = `
          SELECT COALESCE(SUM(aul.cost_usd),0) as cost_usd,
                 COALESCE(SUM(aul.tokens_input),0) as tokens_in,
                 COALESCE(SUM(aul.tokens_output),0) as tokens_out
          FROM api_usage_logs aul
          WHERE (aul.api_key_id = $1 OR aul.key_id = $1) ${dateWhere}
        `;
        const total = await client.query(totalQuery, params);
        console.log('🔍 [admin/usage/user] Total for key', key.id, ':', total.rows[0]);
        
        return {
          ...key,
          by_model: byModel.rows,
          total: total.rows[0] || { cost_usd: 0, tokens_in: 0, tokens_out: 0 }
        };
      } catch (keyError) {
        console.error('❌ Error getting usage for key', key.id, ':', keyError?.message || keyError);
        console.error('❌ Stack:', keyError?.stack);
        return {
          ...key,
          by_model: [],
          total: { cost_usd: 0, tokens_in: 0, tokens_out: 0 }
        };
      }
    }));
    
    // Calculate overall total
    const overallTotal = keysWithUsage.reduce((acc, key) => ({
      cost_usd: acc.cost_usd + Number(key.total.cost_usd || 0),
      tokens_in: acc.tokens_in + Number(key.total.tokens_in || 0),
      tokens_out: acc.tokens_out + Number(key.total.tokens_out || 0)
    }), { cost_usd: 0, tokens_in: 0, tokens_out: 0 });
    
    console.log('🔍 [admin/usage/user] Returning', keysWithUsage.length, 'keys with usage data');
    console.log('🔍 [admin/usage/user] Overall total:', overallTotal);
    
    res.json({ 
      keys: keysWithUsage,
      total: overallTotal
    });
  } catch (e) {
    console.error('admin user usage error', e?.message || e);
    res.status(500).json({ error: 'failed_to_query_usage' });
  } finally {
    client.release();
  }
});

// Admin: model usage with filters
app.get('/api/admin/usage/models', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { start, end, model } = req.query || {};
  const client = await pool.connect();
  try {
    const cond = [];
    const params = [];
    let idx = 1;
    if (model) { cond.push(`aul.model = $${idx++}`); params.push(String(model)); }
    if (start) { cond.push(`aul.created_at >= $${idx++}`); params.push(new Date(String(start))); }
    if (end)   { cond.push(`aul.created_at <  $${idx++}`); params.push(new Date(String(end))); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const q = await client.query(`
      SELECT u.fullname, u.faculty, ak.name as api_name, aul.model,
             COUNT(*) as calls, COALESCE(SUM(aul.tokens_input),0) as tokens_in,
             COALESCE(SUM(aul.tokens_output),0) as tokens_out,
             COALESCE(SUM(aul.cost_usd),0) as cost_usd
      FROM api_usage_logs aul
      LEFT JOIN api_keys ak ON ak.id = aul.key_id
      LEFT JOIN users u ON u.id = ak.user_id
      ${where}
      GROUP BY u.fullname, u.faculty, api_name, aul.model
      ORDER BY cost_usd DESC
    `, params);
    res.json({ items: q.rows });
  } catch (e) {
    console.error('admin models usage error', e?.message || e);
    res.status(500).json({ error: 'failed_to_query_models' });
  } finally {
    client.release();
  }
});

// Alternative usage endpoint via query (avoids path issues on FE)
app.get('/api/keys/usage', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id, value, start, end } = req.query || {};
  const client = await pool.connect();
  try {
    let r;
    const idStr = id ? String(id) : '';
    const isNumericId = idStr && /^\d+$/.test(idStr);
    if (isNumericId) {
      r = await client.query('SELECT id, user_id FROM api_keys WHERE id = $1', [Number(idStr)]);
    } else if (value) {
      r = await client.query('SELECT id, user_id FROM api_keys WHERE key_value = $1 OR right(key_value, 8) = right($1, 8)', [String(value)]);
    } else if (idStr) {
      // id provided but not numeric → treat as key_value
      r = await client.query('SELECT id, user_id FROM api_keys WHERE key_value = $1 OR right(key_value, 8) = right($1, 8)', [idStr]);
    } else {
      return res.status(400).json({ error: 'missing_key' });
    }
    if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    const ownerId = r.rows[0].user_id;
    if (session.user.role !== 'ADMIN' && ownerId !== session.user.id) return res.status(403).json({ error: 'forbidden' });
    const cond = [];
    const keyParam = String(r.rows[0].id); // normalize to text to support integer/uuid schemas
    const params = [keyParam];
    let idx = 2;
    if (start) { cond.push(`created_at >= $${idx++}`); params.push(new Date(String(start))); }
    if (end)   { cond.push(`created_at <  $${idx++}`); params.push(new Date(String(end))); }
    const where = cond.length ? `AND ${cond.join(' AND ')}` : '';
    let q, total;
    // detect available columns for compatibility
    let hasKeyId = false, hasTokens = false, hasCostUsd = false;
    try {
      const cols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='api_usage_logs'
      `);
      const names = cols.rows.map(x => x.column_name);
      hasKeyId = names.includes('key_id');
      hasTokens = names.includes('tokens_input') && names.includes('tokens_output');
      hasCostUsd = names.includes('cost_usd');
    } catch {}
    try {
      const keyClause = hasKeyId ? "(api_key_id::text = $1::text OR key_id::text = $1::text)" : '(api_key_id::text = $1::text)';
      if (hasTokens && hasCostUsd) {
        q = await client.query(`
          SELECT model, COUNT(*) as calls, COALESCE(SUM(tokens_input),0) as tokens_in, COALESCE(SUM(tokens_output),0) as tokens_out,
                 COALESCE(SUM(cost_usd),0) as cost_usd
          FROM api_usage_logs
          WHERE ${keyClause} ${where}
          GROUP BY model
          ORDER BY cost_usd DESC
        `, params);
        total = await client.query(`
          SELECT COALESCE(SUM(cost_usd),0) as cost_usd, COALESCE(SUM(tokens_input),0) as tokens_in, COALESCE(SUM(tokens_output),0) as tokens_out
          FROM api_usage_logs
          WHERE ${keyClause} ${where}
        `, params);
      } else {
        // Legacy fallback: only cost/tokens_used available
        q = await client.query(`
          SELECT COALESCE(model,'unknown') as model, COUNT(*) as calls, 0 as tokens_in, 0 as tokens_out,
                 COALESCE(SUM(cost),0) as cost_usd
          FROM api_usage_logs
          WHERE ${keyClause} ${where}
          GROUP BY model
          ORDER BY cost_usd DESC
        `, params);
        total = await client.query(`
          SELECT COALESCE(SUM(cost),0) as cost_usd, 0 as tokens_in, 0 as tokens_out
          FROM api_usage_logs
          WHERE ${keyClause} ${where}
        `, params);
      }
    } catch (err) {
      // Fallback for legacy schema where only tokens_used/cost columns exist
      console.warn('usage query fallback due to:', err?.message || err);
      const keyClause = hasKeyId ? "(api_key_id::text = $1::text OR key_id::text = $1::text)" : '(api_key_id::text = $1::text)';
      q = await client.query(`
        SELECT COALESCE(model,'unknown') as model, COUNT(*) as calls, 0 as tokens_in, 0 as tokens_out,
               COALESCE(SUM(cost),0) as cost_usd
        FROM api_usage_logs
        WHERE ${keyClause} ${where}
        GROUP BY model
        ORDER BY cost_usd DESC
      `, params);
      total = await client.query(`
        SELECT COALESCE(SUM(cost),0) as cost_usd, 0 as tokens_in, 0 as tokens_out
        FROM api_usage_logs
        WHERE ${keyClause} ${where}
      `, params);
    }
    res.json({ by_model: q.rows, total: total.rows[0] });
  } catch (e) {
    console.error('GET /api/keys/usage error:', e?.message || e);
    res.status(500).json({ error: 'failed_to_query_usage' });
  } finally {
    client.release();
  }
});

// Quick test endpoint: send a prompt with selected model using the user's API key
app.post('/api/test-model', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const { keyId, model, prompt } = req.body || {};
  if (!keyId || !model || !prompt) return res.status(400).json({ error: 'missing_params' });
  const client = await pool.connect();
  try {
    // verify key ownership
    const r = await client.query('SELECT id, user_id, key_value, is_active, credit_limit FROM api_keys WHERE id = $1', [keyId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'key_not_found' });
    const key = r.rows[0];
    if (session.user.role !== 'ADMIN' && key.user_id !== session.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (!key.is_active) return res.status(403).json({ error: 'key_disabled', message: 'This API key has been disabled' });
    
    // Check credit limit - get current usage
    const usageQuery = await client.query(`
      SELECT COALESCE(SUM(cost_usd), 0) as total_used
      FROM api_usage_logs
      WHERE api_key_id = $1
    `, [keyId]);
    const totalUsed = Number(usageQuery.rows[0]?.total_used || 0);
    const creditLimit = Number(key.credit_limit || 0);
    const remaining = creditLimit - totalUsed;
    
    // If credit limit is 0 or exhausted, reject the request
    if (creditLimit > 0 && remaining <= 0) {
      // Auto-disable the key if credit is exhausted
      await client.query('UPDATE api_keys SET is_active = false WHERE id = $1', [keyId]);
      return res.status(403).json({ 
        error: 'credit_exhausted', 
        message: 'Credit limit has been reached. This API key has been automatically disabled.',
        used: totalUsed,
        limit: creditLimit
      });
    }
    
    // If credit limit is 0, reject (but don't auto-disable as it might be intentional)
    if (creditLimit === 0) {
      return res.status(403).json({ 
        error: 'credit_limit_zero', 
        message: 'Credit limit is set to 0. Please set a credit limit to use this API key.',
        used: totalUsed,
        limit: creditLimit
      });
    }
    
    console.log(`💰 [test-model] Credit check for key ${keyId}: $${totalUsed.toFixed(4)} / $${creditLimit.toFixed(2)} (remaining: $${remaining.toFixed(4)})`);

    // call OpenRouter chat completions using this key
    let data;
    try {
      // Use provider key if this is a local gateway key
      const providerKey = (String(key.key_value || '').startsWith('ubu_'))
        ? (key.provider_key_value)
        : key.key_value;
      let useKey = providerKey || (await client.query('SELECT provider_key_value FROM api_keys WHERE id = $1', [key.id])).rows[0]?.provider_key_value;
      if (!useKey) {
        // First try provisioning a dedicated key (if token has permission)
        if (OPENROUTER_TOKEN) {
          const created = await orCreateKey(`gateway-${key.id}`, 10);
          if (created?.value) {
            await client.query('UPDATE api_keys SET provider_key_value = $2, provider = $3 WHERE id = $1', [key.id, created.value, 'openrouter']);
            useKey = created.value;
          } else {
            // Fallback to using global token directly for the call (no provisioning capability)
            useKey = OPENROUTER_TOKEN;
          }
        }
      }
      if (!useKey) return res.status(401).json({ error: 'provider_key_missing' });
      const resp = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [{ role: 'user', content: String(prompt) }]
      }, {
        headers: {
          Authorization: `Bearer ${useKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
          'X-Title': 'UBU AI FLOW'
        },
        timeout: 20000
      });
      data = resp.data;
    } catch (e) {
      // return error from provider
      const status = e?.response?.status || 500;
      return res.status(status).json({ error: 'provider_error', details: e?.response?.data || e?.message });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage || {};
    const tokensIn = Number(usage?.prompt_tokens || usage?.input_tokens || 0);
    const tokensOut = Number(usage?.completion_tokens || usage?.output_tokens || 0);
    const tokensTotal = Number(usage?.total_tokens || tokensIn + tokensOut);
    // Estimate cost if provider didn't return it, using real OpenRouter pricing when available
    let cost = Number(usage?.total_cost || 0);
    if (!Number.isFinite(cost) || cost === 0) {
      const pricing = await getModelPricingPerM(data?.model || model);
      if (pricing && Number.isFinite(pricing.inM) && Number.isFinite(pricing.outM)) {
        cost = (tokensIn / 1_000_000) * pricing.inM + (tokensOut / 1_000_000) * pricing.outM;
      } else {
        // Fallback to minimal static table if pricing not found
        const mname = String(data?.model || model || '').toLowerCase();
        const table = [
          { match: 'gpt-4o', inM: 5, outM: 15 },
          { match: 'gpt-4o-mini', inM: 0.5, outM: 1.5 },
        ];
        let inM = 0, outM = 0;
        for (const t of table) if (mname.includes(t.match)) { inM = t.inM; outM = t.outM; break; }
        if (inM && outM) {
          cost = (tokensIn / 1_000_000) * inM + (tokensOut / 1_000_000) * outM;
        } else {
          cost = 0;
        }
      }
    }
    // best-effort usage log (support legacy columns too)
    try {
      await client.query(`
        INSERT INTO api_usage_logs (api_key_id, user_id, provider, action, request_id, cost, tokens_used, response_time_ms, status_code, model, tokens_input, tokens_output, cost_usd)
        VALUES ($1, $2, 'openrouter', 'chat.completions', $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [key.id, key.user_id, data?.id || null, cost, tokensTotal, 0, 200, data?.model || model, tokensIn, tokensOut, cost]);
      
      // Update last_used_at for the API key
      await client.query('UPDATE api_keys SET last_used_at = timezone(\'Asia/Bangkok\', now()) WHERE id = $1', [key.id]);
    } catch {}

    // increase current spend on the key so Admin/Status shows updated "Used"
    try {
      await client.query('UPDATE api_keys SET current_spend = COALESCE(current_spend,0) + $2, updated_at = timezone(\'Asia/Bangkok\', now()) WHERE id = $1', [key.id, cost]);
    } catch {}

    res.json({ ok: true, modelUsed: data?.model || model, output: text, usage: { tokensIn, tokensOut } });
  } finally {
    client.release();
  }
});

// --- Auth endpoints (real UBU Portal) ---
// GET endpoint for OAuth redirect to UBU Portal
app.get('/api/oauth-login', (req, res) => {
  console.log('🔄 GET /api/oauth-login - Redirecting to UBU Portal');
  const next = req.query.next || '/';
  
  // UBU Portal OAuth configuration
  const clientId = process.env.OAUTH_CLIENT_ID || 'ubu-ai-gateway';
  
  // Build redirect URI from request if not set in env
  let redirectUri = process.env.REDIRECT_URI;
  if (!redirectUri) {
    // Auto-detect from request headers
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:3000';
    
    // Check if production (dev2.ubu.ac.th)
    if (host.includes('dev2.ubu.ac.th')) {
      // In production, send the user agent back to backend callback so we can set cookie directly
      redirectUri = `https://dev2.ubu.ac.th/ai_gateway_api/api/oauth/callback`;
    } else {
      redirectUri = `${protocol}://${host}/callback`;
    }
  }
  
  const oauthUrl = process.env.OAUTH_LOGIN_URL || 'https://dev.ubu.ac.th/oauth_server/login';
  
  // NOTE: UBU portal expects parameter name 'redirect' (not redirect_uri)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect: redirectUri,
    state: next,
    response_type: 'code'
  });
  
  const fullOauthUrl = `${oauthUrl}?${params.toString()}`;
  console.log(`📍 Redirecting to UBU Portal: ${fullOauthUrl}`);
  console.log(`🔗 Using redirect URI: ${redirectUri}`);
  res.redirect(fullOauthUrl);
});

// OAuth callback handler
app.post('/api/oauth/callback', async (req, res) => {
  console.log('🔄 POST /api/oauth/callback - Processing OAuth callback');
  const { code, accessToken } = req.body || {};

  try {
    let tokenToUse = accessToken;

    if (!tokenToUse) {
      if (!code) {
        console.log('❌ Missing OAuth code or accessToken');
        return res.status(400).json({ success: false, message: 'Missing OAuth code or accessToken' });
      }
      // Exchange code for access token with UBU Portal
      const tokenResponse = await fetch(`${process.env.OAUTH_TOKEN_URL || 'https://dev.ubu.ac.th/oauth_server/token'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.OAUTH_CLIENT_ID || 'ubu-ai-gateway',
          client_secret: process.env.OAUTH_CLIENT_SECRET || 'your-client-secret',
          code: code,
          redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000/callback'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      tokenToUse = tokenData.access_token;
      console.log('🎫 Access token received via code exchange');
    } else {
      console.log('🎫 Access token received directly from portal');
    }

    // Get user info from UBU Portal using the access token
    const userResponse = await fetch(`${process.env.OAUTH_ME_URL || 'https://dev.ubu.ac.th/oauth_server/me'}`, {
      headers: { 'Authorization': `Bearer ${tokenToUse}` }
    });

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    const userInfo = await userResponse.json();
    console.log('👤 User info received (POST):', JSON.stringify(userInfo, null, 2));

    // Map UBU portal user payload to our schema
    const u = userInfo.user || userInfo;
    const derivedUsername = u?.sAMAccountName || u?.nickname || (u?.mail ? String(u.mail).split('@')[0] : u?.sub || 'unknown');
    
    // Log OAuth response to debug field names
    console.log('🔍 OAuth user data fields:', Object.keys(u));
    console.log('🔍 OAuth faculty/department fields:', {
      faculty_name: u?.faculty_name,
      faculty: u?.faculty,
      department_name: u?.department_name,
      department: u?.department,
      org: u?.org,
      organization: u?.organization
    });
    console.log('🔍 Derived username for HR lookup:', derivedUsername);
    
    const mappedUser = {
      ubuaccount: derivedUsername,
      prefix_name: u?.prefix_name || '',
      fname: u?.TCSFirstNameT || u?.given_name || u?.firstName || '',
      lname: u?.TCSLastNameT || u?.family_name || u?.lastName || '',
      faculty: u?.faculty_name || u?.faculty || u?.facultyName || 'ไม่ระบุ',
      department_name: u?.department_name || u?.department || u?.departmentName || 'ไม่ระบุ',
      email: u?.mail || u?.email || '',
      position: u?.positiontype_name || u?.position || u?.positionName || '',
      level_name: u?.level_name || u?.levelName || '',
      personcode: u?.personcode || u?.personCode || ''
    };

    // Enrich with HR data if some fields are missing
    if (!mappedUser.faculty || mappedUser.faculty === 'ไม่ระบุ' ||
        !mappedUser.department_name || mappedUser.department_name === 'ไม่ระบุ' ||
        !mappedUser.position || !mappedUser.level_name || !mappedUser.personcode) {
      try {
        const hr = await fetchHrData(derivedUsername);
        if (hr) {
          // Only update if current value is missing or 'ไม่ระบุ'
          if (!mappedUser.faculty || mappedUser.faculty === 'ไม่ระบุ') {
            mappedUser.faculty = hr.faculty || mappedUser.faculty;
          }
          if (!mappedUser.department_name || mappedUser.department_name === 'ไม่ระบุ') {
            mappedUser.department_name = hr.department_name || mappedUser.department_name;
          }
          if (!mappedUser.position) {
            mappedUser.position = hr.position || mappedUser.position;
          }
          if (!mappedUser.level_name) {
            mappedUser.level_name = hr.level_name || mappedUser.level_name;
          }
          if (!mappedUser.personcode) {
            mappedUser.personcode = hr.personcode || mappedUser.personcode;
          }
          // also prefer names from HR if missing
          if (!mappedUser.prefix_name) {
            mappedUser.prefix_name = hr.prefix_name || mappedUser.prefix_name || '';
          }
          if (!mappedUser.fname) {
            mappedUser.fname = hr.fname || mappedUser.fname || '';
          }
          if (!mappedUser.lname) {
            mappedUser.lname = hr.lname || mappedUser.lname || '';
          }
          if (!mappedUser.email) {
            mappedUser.email = hr.email || mappedUser.email || '';
          }
          console.log('✅ HR data enriched:', {
            faculty: mappedUser.faculty,
            department_name: mappedUser.department_name,
            fromHR: { faculty: hr.faculty, department_name: hr.department_name }
          });
        }
      } catch (e) {
        console.warn('HR enrichment failed:', e?.message || e);
      }
    }

    // Create or update user in database
    const user = await createOrUpdateUser(mappedUser);
    console.log('💾 User saved to database:', user);

    const token = sign({ user, iat: Date.now() });
    // Detect protocol and host from request
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isHttps = protocol === 'https';
    
    setCookie(res, 'session', token, { 
      httpOnly: true, 
      path: '/', 
      isHttps, 
      protocol,
      host 
    });
    console.log(`🍪 Session cookie set for host: ${host}, protocol: ${protocol}, https: ${isHttps}, localhost: ${host.includes('localhost') || host.includes('127.0.0.1')}`);
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    res.status(500).json({ success: false, message: 'OAuth authentication failed' });
  }
});

// Fallback: support GET /api/oauth/callback with query params (some environments may not POST)
app.get('/api/oauth/callback', async (req, res) => {
  console.log('🔄 GET /api/oauth/callback - Processing OAuth callback (GET)');
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;
  const accessTokenParam = typeof req.query.accessToken === 'string' ? req.query.accessToken : (typeof req.query.access_token === 'string' ? req.query.access_token : undefined);
  const accessToken = accessTokenParam;

  // Reuse the same logic by calling the POST handler body
  try {
    let tokenToUse = accessToken;

    if (!tokenToUse) {
      if (!code) {
        console.log('❌ Missing OAuth code or accessToken');
        return res.status(400).json({ success: false, message: 'Missing OAuth code or accessToken' });
      }
      const tokenResponse = await fetch(`${process.env.OAUTH_TOKEN_URL || 'https://dev.ubu.ac.th/oauth_server/token'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.OAUTH_CLIENT_ID || 'ubu-ai-gateway',
          client_secret: process.env.OAUTH_CLIENT_SECRET || 'your-client-secret',
          code: code,
          redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000/callback'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      tokenToUse = tokenData.access_token;
      console.log('🎫 Access token received via code exchange (GET)');
    } else {
      console.log('🎫 Access token received directly from portal (GET)');
    }

    const userResponse = await fetch(`${process.env.OAUTH_ME_URL || 'https://dev.ubu.ac.th/oauth_server/me'}`, {
      headers: { 'Authorization': `Bearer ${tokenToUse}` }
    });

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    const userInfo = await userResponse.json();
    console.log('👤 User info received (GET):', JSON.stringify(userInfo, null, 2));

    // Map UBU portal user payload to our schema (same as POST handler)
    const u = userInfo.user || userInfo;
    const derivedUsername = u?.sAMAccountName || u?.nickname || (u?.mail ? String(u.mail).split('@')[0] : u?.sub || 'unknown');
    
    // Log OAuth response to debug field names
    console.log('🔍 OAuth user data fields (GET):', Object.keys(u));
    console.log('🔍 OAuth faculty/department fields (GET):', {
      faculty_name: u?.faculty_name,
      faculty: u?.faculty,
      department_name: u?.department_name,
      department: u?.department
    });
    console.log('🔍 Derived username for HR lookup (GET):', derivedUsername);
    
    const mappedUser = {
      ubuaccount: derivedUsername,
      prefix_name: u?.prefix_name || '',
      fname: u?.TCSFirstNameT || u?.given_name || u?.firstName || '',
      lname: u?.TCSLastNameT || u?.family_name || u?.lastName || '',
      faculty: u?.faculty_name || u?.faculty || u?.facultyName || 'ไม่ระบุ',
      department_name: u?.department_name || u?.department || u?.departmentName || 'ไม่ระบุ',
      email: u?.mail || u?.email || '',
      position: u?.positiontype_name || u?.position || u?.positionName || '',
      level_name: u?.level_name || u?.levelName || '',
      personcode: u?.personcode || u?.personCode || ''
    };
    
    // Enrich with HR data if some fields are missing (same logic as POST handler)
    if (!mappedUser.faculty || mappedUser.faculty === 'ไม่ระบุ' ||
        !mappedUser.department_name || mappedUser.department_name === 'ไม่ระบุ' ||
        !mappedUser.position || !mappedUser.level_name || !mappedUser.personcode) {
      try {
        const hr = await fetchHrData(derivedUsername);
        if (hr) {
          // Only update if current value is missing or 'ไม่ระบุ'
          if (!mappedUser.faculty || mappedUser.faculty === 'ไม่ระบุ') {
            mappedUser.faculty = hr.faculty || mappedUser.faculty;
          }
          if (!mappedUser.department_name || mappedUser.department_name === 'ไม่ระบุ') {
            mappedUser.department_name = hr.department_name || mappedUser.department_name;
          }
          if (!mappedUser.position) {
            mappedUser.position = hr.position || mappedUser.position;
          }
          if (!mappedUser.level_name) {
            mappedUser.level_name = hr.level_name || mappedUser.level_name;
          }
          if (!mappedUser.personcode) {
            mappedUser.personcode = hr.personcode || mappedUser.personcode;
          }
          // also prefer names from HR if missing
          if (!mappedUser.prefix_name) {
            mappedUser.prefix_name = hr.prefix_name || mappedUser.prefix_name || '';
          }
          if (!mappedUser.fname) {
            mappedUser.fname = hr.fname || mappedUser.fname || '';
          }
          if (!mappedUser.lname) {
            mappedUser.lname = hr.lname || mappedUser.lname || '';
          }
          if (!mappedUser.email) {
            mappedUser.email = hr.email || mappedUser.email || '';
          }
          console.log('✅ HR data enriched (GET):', {
            faculty: mappedUser.faculty,
            department_name: mappedUser.department_name,
            fromHR: { faculty: hr.faculty, department_name: hr.department_name }
          });
        }
      } catch (e) {
        console.warn('HR enrichment failed (GET):', e?.message || e);
      }
    }

    const user = await createOrUpdateUser(mappedUser);
    console.log('💾 User saved to database (GET):', user);

    const token = sign({ user, iat: Date.now() });
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isHttps = protocol === 'https';
    setCookie(res, 'session', token, {
      httpOnly: true,
      path: '/',
      isHttps,
      protocol,
      host
    });
    console.log(`🍪 Session cookie set (GET) for host: ${host}, protocol: ${protocol}, https: ${isHttps}`);

    // After setting cookie, redirect the browser back to the SPA
    const frontendUrl = host.includes('dev2.ubu.ac.th')
      ? 'https://dev2.ubu.ac.th/ai_gateway/'
      : 'http://localhost:3000/';
    return res.redirect(frontendUrl);
  } catch (error) {
    console.error('❌ OAuth callback error (GET):', error.message);
    res.status(500).json({ success: false, message: 'OAuth authentication failed' });
  }
});

// Direct username login (for testing)
app.post('/api/oauth-login', async (req, res) => {
  console.log('🔐 POST /api/oauth-login - Direct username login');
  const { username } = req.body || {};
  console.log('📝 Username received:', username);
  
  if (!username) {
    console.log('❌ Missing username');
    return res.status(400).json({ success: false, message: 'missing username' });
  }

  try {
    // Simulate HR data fetch (replace with real HR API call)
    const hrData = await fetchHrData(username);
    if (!hrData) {
      console.log('❌ User not found in HR system');
      return res.status(403).json({ success: false, message: 'User not found in HR system' });
    }

    // Create or update user in database
    const user = await createOrUpdateUser(hrData);
    console.log('💾 User saved to database:', user);

    const token = sign({ user, iat: Date.now() });
    // Detect protocol and host from request
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isHttps = protocol === 'https';
    
    setCookie(res, 'session', token, { 
      httpOnly: true, 
      path: '/', 
      isHttps, 
      protocol,
      host 
    });
    console.log(`🍪 Session cookie set for host: ${host}, protocol: ${protocol}, https: ${isHttps}, localhost: ${host.includes('localhost') || host.includes('127.0.0.1')}`);
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.get('/api/me', (req, res) => {
  console.log('👤 GET /api/me - Checking user session');
  console.log('   Origin:', req.headers.origin);
  console.log('   Host:', req.headers.host);
  console.log('   Cookie header:', req.headers.cookie);
  const cookies = parseCookies(req);
  console.log('🍪 Cookies received:', cookies);
  console.log('   Session cookie value:', cookies.session ? `${cookies.session.substring(0, 50)}...` : '(empty)');

  const session = verify(cookies.session);
  if (session?.user) {
    console.log('✅ Valid session found for user:', session.user.username);
  } else {
    console.log('❌ No valid session found');
  }

  // allow reading session for cross-site requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Support both localhost and production origin
  const origin = req.headers.origin || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.json({ user: session?.user || null });
});

// Logout - clear session cookie
app.post('/api/logout', (req, res) => {
  try {
    // Expire the session cookie immediately
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isHttps = protocol === 'https';
    setCookie(res, 'session', '', { 
      path: '/', 
      maxAge: 0, 
      httpOnly: true, 
      isHttps,
      protocol,
      host
    });
    // CORS headers for SPA to be able to read the response
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

// --- Admin User Management ---
// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
  console.log('👥 GET /api/admin/users - Listing all users');
  
  // Check admin role
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log('❌ Unauthorized: Admin role required');
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, ubuaccount, fullname, faculty, department_name, email, 
             position, role, status, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    client.release();
    
    console.log(`📊 Found ${result.rows.length} users`);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
app.post('/api/admin/users', async (req, res) => {
  console.log('👤 POST /api/admin/users - Creating user');

  // Check admin role
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log('❌ Unauthorized: Admin role required');
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    ubuaccount,
    fullname,
    email,
    faculty,
    department_name,
    position,
    level_name,
    personcode,
    role = 'USER',
    status = 'active'
  } = req.body || {};

  if (!ubuaccount || !fullname) {
    return res.status(400).json({ error: 'ubuaccount and fullname are required' });
  }

  try {
    const client = await pool.connect();
    try {
      // Ensure not exists
      const dup = await client.query('SELECT id FROM users WHERE ubuaccount = $1', [ubuaccount]);
      if (dup.rows.length > 0) {
        return res.status(409).json({ error: 'User with this UBU account already exists' });
      }

      const result = await client.query(`
        INSERT INTO users (ubuaccount, personcode, fullname, faculty, department_name, email, position, level_name, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `, [ubuaccount, personcode || null, fullname, faculty || null, department_name || null, email || null, position || null, level_name || null, role, status]);

      const user = result.rows[0];
      console.log('✅ User created successfully');
      return res.json({ user });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error adding user:', error);
    return res.status(500).json({ error: 'Failed to add user' });
  }
});

// Update user (admin only)
app.patch('/api/admin/users/:id', async (req, res) => {
  console.log(`👤 PATCH /api/admin/users/${req.params.id} - Updating user`);
  
  // Check admin role
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log('❌ Unauthorized: Admin role required');
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { role, status } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE users 
      SET role = $2, status = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [req.params.id, role, status]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User updated successfully');
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', async (req, res) => {
  console.log(`🗑️ DELETE /api/admin/users/${req.params.id} - Deleting user`);
  
  // Check admin role
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log('❌ Unauthorized: Admin role required');
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    client.release();
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- API Keys CRUD (in-memory for local) ---
// Moved under /api/mock/keys to avoid clashing with real authenticated /api/keys
app.get('/api/mock/keys', (req, res) => {
  console.log('🔑 GET /api/keys - Listing API keys');
  const keys = Array.from(apiKeys.values());
  console.log(`📊 Found ${keys.length} API keys`);
  res.json({ items: keys });
});

app.post('/api/mock/keys', (req, res) => {
  console.log('🔑 POST /api/keys - Creating new API key');
  const { name = 'New Key', spendingLimit = 0 } = req.body || {};
  console.log('📝 Key details:', { name, spendingLimit });
  
  const id = crypto.randomUUID();
  const prefix = 'ubu-ai-';
  const key = prefix + crypto.randomBytes(12).toString('hex');
  const item = { id, name, prefix, key, isActive: true, spendingLimit, currentSpend: 0, createdAt: new Date().toISOString() };
  
  apiKeys.set(id, item);
  console.log('✅ API key created:', { id, name, key: key.substring(0, 20) + '...' });
  
  res.status(201).json(item);
});

app.get('/api/mock/keys/:id', (req, res) => {
  const item = apiKeys.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.patch('/api/mock/keys/:id', (req, res) => {
  const item = apiKeys.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  Object.assign(item, req.body || {});
  apiKeys.set(item.id, item);
  res.json(item);
});

app.delete('/api/mock/keys/:id', (req, res) => {
  const ok = apiKeys.delete(req.params.id);
  res.json({ ok });
});

// (Removed duplicate admin user endpoints that used an undefined 'db')

// API Key Request endpoints
app.post('/api/requests', async (req, res) => {
  try {
    const { firstName, lastName, email, studentId, department, apiKeyName, purpose, expectedUsage, courseName, otherDetails, creditLimit = 10 } = req.body;
    
    if (!firstName || !lastName || !email || !apiKeyName) {
      return res.status(400).json({ error: 'firstName, lastName, email, and apiKeyName are required' });
    }

    // Get current user from session
    const session = verify(parseCookies(req).session);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO api_key_requests (user_id, api_key_name, first_name, last_name, email, student_id, department, purpose, expected_usage, course_name, other_details, credit_limit, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [session.user.id, apiKeyName, firstName, lastName, email, studentId, department, purpose, expectedUsage, courseName || null, otherDetails || null, creditLimit]);

      const reqRow = result.rows[0];
      const approveUrl = `${BASE_URL}/ai_gateway/admin/requests?approve=${reqRow.id}`;
      
      // Send regular notification with link (simple text format)
      const lines = [
        `มีคำขอ API Key ใหม่`,
        `ชื่อคีย์: ${reqRow.api_key_name}`,
        `ผู้ขอ: ${reqRow.first_name} ${reqRow.last_name} (${reqRow.email})`,
        `คณะ/หน่วยงาน: ${reqRow.department || '-'}`,
        `วัตถุประสงค์: ${reqRow.purpose || '-'}`,
        `คาดว่าใช้: ${reqRow.expected_usage || '-'}`,
        ...(reqRow.course_name ? [`รายวิชา: ${reqRow.course_name}`] : []),
        ...(reqRow.other_details ? [`รายละเอียด: ${reqRow.other_details}`] : []),
        `เครดิต: $${Number(reqRow.credit_limit || 0).toFixed(2)}`,
        `เวลา: ${new Date().toLocaleString('th-TH')}`,
        ``,
        `👍 คลิกเพื่ออนุมัติ: ${approveUrl}`
      ];
      
      sendNotifyMessage(lines.join('\n')).catch(() => {});

      res.json({ request: reqRow });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Get user's API key requests
app.get('/api/requests', async (req, res) => {
  try {
    const session = verify(parseCookies(req).session);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Cleanup old pending requests before returning list
    await cleanupOldPendingRequests();

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id, user_id, api_key_name, first_name, last_name, email, student_id, department, purpose, expected_usage, course_name, other_details, credit_limit, status,
          created_at, updated_at
        FROM api_key_requests 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [session.user.id]);
      res.json({ requests: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Delete a user's own pending request
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const session = verify(parseCookies(req).session);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM api_key_requests WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING id`,
        [req.params.id, session.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Request not found or not deletable' });
      }

      return res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// Get user's approved API keys
app.get('/api/keys', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT *
        FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [user.id]);

      const keys = result.rows;

      // Enrich with OpenRouter usage if possible
      const orKeys = await orListKeys();
      for (const k of keys) {
        const match = orKeys.find(item => {
          const val = item?.value || item?.key || '';
          return val && k.key_value && (val === k.key_value || val.endsWith(k.key_value.slice(-4)));
        });
        if (match) {
          k.current_spend = Number(match.usage || match.used || 0);
          if (match.limit) k.credit_limit = Number(match.limit);
        }
      }

      res.json({ keys });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Refresh usage/limit from provider for current user's keys
app.post('/api/keys/refresh', async (req, res) => {
  try {
    const session = verify(parseCookies(req).session);
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, key_value FROM api_keys WHERE user_id = $1', [session.user.id]);
      const orKeys = await orListKeys();
      for (const row of result.rows) {
        const match = orKeys.find(item => {
          const val = item?.value || item?.key || '';
          return val && row.key_value && (val === row.key_value || val.endsWith(row.key_value.slice(-4)));
        });
        if (match) {
          await client.query('UPDATE api_keys SET current_spend = $2, credit_limit = COALESCE($3, credit_limit), updated_at = NOW() WHERE id = $1', [row.id, Number(match.usage || match.used || 0), match.limit ? Number(match.limit) : null]);
        }
      }
      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error refreshing keys:', e);
    res.status(500).json({ error: 'Failed to refresh keys' });
  }
});

// Delete a key (owner only)
app.delete('/api/keys/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id', [id, user.id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error deleting key:', e);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

// Update key name by owner
app.patch('/api/keys/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    const { name } = req.body || {};
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }
    
    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM api_keys WHERE id = $1 AND user_id = $2', [id, user.id]);
      if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      
      const result = await client.query(
        "UPDATE api_keys SET name = $2, updated_at = timezone('Asia/Bangkok', now()) WHERE id = $1 RETURNING *",
        [id, name.trim()]
      );
      return res.json({ key: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error updating key name:', e);
    res.status(500).json({ error: 'Failed to update key name' });
  }
});

// Toggle key active status (enable/disable) by owner
app.patch('/api/keys/:id/toggle', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id, is_active FROM api_keys WHERE id = $1 AND user_id = $2', [id, user.id]);
      if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const newStatus = !existing.rows[0].is_active;
      const result = await client.query("UPDATE api_keys SET is_active = $2, updated_at = timezone('Asia/Bangkok', now()) WHERE id = $1 RETURNING *", [id, newStatus]);
      return res.json({ key: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error toggling key:', e);
    res.status(500).json({ error: 'Failed to toggle key' });
  }
});

// Delete key by owner
app.delete('/api/keys/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM api_keys WHERE id = $1 AND user_id = $2', [id, user.id]);
      if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      await client.query('DELETE FROM api_keys WHERE id = $1', [id]);
      return res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error deleting key:', e);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

// Admin: Get all API key requests
app.get('/api/admin/requests', async (req, res) => {
  try {
    const session = verify(parseCookies(req).session);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Cleanup stale pending requests
    await cleanupOldPendingRequests();

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        akr.id, akr.user_id, akr.api_key_name, akr.first_name, akr.last_name, akr.email, akr.student_id, akr.department, akr.purpose, akr.expected_usage, akr.course_name, akr.other_details, akr.credit_limit, akr.status,
        akr.created_at, akr.updated_at,
        u.fullname as user_fullname, u.ubuaccount
      FROM api_key_requests akr
      LEFT JOIN users u ON akr.user_id = u.id
      ORDER BY akr.created_at DESC
    `);
    client.release();

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Admin: Approve API key request
app.post('/api/admin/requests/:id/approve', async (req, res) => {
  try {
    // Check if this is a direct API call (from Google Chat button) or web request
    const isDirectCall = !req.headers.cookie || !parseCookies(req).session;
    const session = isDirectCall ? null : verify(parseCookies(req).session);
    
    // For direct calls (Google Chat), we need a token or allow it
    // For now, allow direct calls but log them
    if (!isDirectCall && (!session?.user || session.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (isDirectCall) {
      console.log('⚠️ Direct approve call from Google Chat button - request ID:', req.params.id);
    }
    
  const requestId = req.params.id;

  const client = await pool.connect();
  try {
    // Get the request
    const requestResult = await client.query('SELECT * FROM api_key_requests WHERE id = $1', [requestId]);
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Try create key on OpenRouter, fallback to local random
    const created = await orCreateKey(request.api_key_name, request.credit_limit);
    const apiKeyValue = created?.value || `ubu_${crypto.randomBytes(16).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');
    const keyPrefix = (apiKeyValue && typeof apiKeyValue === 'string') ? apiKeyValue.slice(0, 8) : 'local';

    const keyResult = await client.query(`
      INSERT INTO api_keys (user_id, request_id, name, key_value, key_hash, key_prefix, credit_limit, current_spend, provider, provider_key_value, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, timezone('Asia/Bangkok', now()), timezone('Asia/Bangkok', now()))
      RETURNING *
    `, [request.user_id, requestId, request.api_key_name, apiKeyValue, keyHash, keyPrefix, request.credit_limit, created?.usage || 0, created ? 'openrouter' : 'local', created?.value || null]);

    // Update request status
    await client.query(`
      UPDATE api_key_requests 
      SET status = 'approved', updated_at = timezone('Asia/Bangkok', now())
      WHERE id = $1
    `, [requestId]);

    // Get user email
    const userResult = await client.query('SELECT email FROM users WHERE id = $1', [request.user_id]);
    const userEmail = userResult.rows[0]?.email || request.email;
    const recipientName = `${request.first_name} ${request.last_name}`;
    
    // Create notification for requester
    await client.query(
      'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
      [request.user_id, 'คำขอได้รับการอนุมัติ', `คำขอ API Key "${request.api_key_name}" ได้รับการอนุมัติแล้ว คุณสามารถใช้งาน API Key ได้แล้ว`]
    );
    
    // Send approval email
    const emailSubject = `คำขอ API Key ได้รับการอนุมัติ - ${request.api_key_name}`;
    const apiKeyUrl = `https://dev2.ubu.ac.th/ai_gateway/keys`;
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="UTF-8" />
        <title>อนุมัติ API Key</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:'Kanit', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.05);">
                <tr>
                  <td style="padding:30px; text-align:center; background-color:#0077b6; color:#ffffff;">
                    <h2 style="margin:0;">✅ คำขอ API Key ได้รับการอนุมัติ</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px; color:#333333; font-size:16px;">
                    <p style="margin-top:0;">เรียนคุณ <strong>${recipientName}</strong>,</p>
                    <p>คำขอ API Key ของคุณได้รับการอนุมัติแล้ว</p>
                    <div style="background-color:#f8f9fa; padding:15px; border-radius:6px; margin:20px 0;">
                      <p style="margin:5px 0;"><strong>ชื่อคีย์:</strong> ${request.api_key_name}</p>
                      <p style="margin:5px 0;"><strong>เครดิต:</strong> $${Number(request.credit_limit || 0).toFixed(2)}</p>
                      <p style="margin:5px 0;"><strong>คณะ/หน่วยงาน:</strong> ${request.department || '-'}</p>
                    </div>
                    <p style="margin-top:30px; text-align:center;">
                      <a href="${apiKeyUrl}" target="_blank" 
                        style="background-color:#0077b6; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; font-weight:bold;">
                        👉 ดู API Key ของคุณ
                      </a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px; text-align:center; font-size:12px; color:#888888;">
                    ระบบ AI Gateway มหาวิทยาลัยอุบลราชธานี<br/>
                    <a href="https://dev2.ubu.ac.th/ai_gateway" style="color:#888888; text-decoration:none;">dev2.ubu.ac.th/ai_gateway</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
    const emailText = `เรียนคุณ ${recipientName},\n\nคำขอ API Key ของคุณได้รับการอนุมัติแล้ว\n\nชื่อคีย์: ${request.api_key_name}\nเครดิต: $${Number(request.credit_limit || 0).toFixed(2)}\nคณะ/หน่วยงาน: ${request.department || '-'}\n\nดู API Key ของคุณ: ${apiKeyUrl}`;
    
    sendEmail(userEmail, emailSubject, emailHtml, emailText).catch(() => {});

    // notify approval to admin (do not include full key for security)
    const adminLines = [
      'คำขอ API Key ได้รับการอนุมัติ',
      `ชื่อคีย์: ${request.api_key_name}`,
      `ผู้ขอ: ${request.first_name} ${request.last_name} (${request.email})`,
      `คณะ/หน่วยงาน: ${request.department || '-'}`,
      `เครดิต: $${Number(request.credit_limit || 0).toFixed(2)}`
    ];
    sendNotifyMessage(adminLines.join('\n')).catch(() => {});
    
    // Send notification to requester
    const requesterLines = [
      '✅ คำขอ API Key ของคุณได้รับการอนุมัติแล้ว',
      `ชื่อคีย์: ${request.api_key_name}`,
      `เครดิต: $${Number(request.credit_limit || 0).toFixed(2)}`,
      `คณะ/หน่วยงาน: ${request.department || '-'}`,
      ``,
      `👉 ดู API Key ของคุณ: ${apiKeyUrl}`
    ];
    
    // Try to send notification to requester's email or via notify system
    // For now, we'll send via the same notify system (admin will see it)
    // In the future, could be enhanced to send to user's personal notification channel
    sendNotifyMessage(requesterLines.join('\n')).catch(() => {});

    // If called from Google Chat, return HTML response for better UX
    if (isDirectCall) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>อนุมัติสำเร็จ</title>
          <style>
            body { font-family: 'Kanit', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 400px; }
            h1 { color: #10b981; margin: 0 0 20px 0; }
            p { color: #666; margin: 10px 0; }
            .close { margin-top: 20px; padding: 10px 20px; background: #0077b6; color: white; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ อนุมัติสำเร็จ</h1>
            <p>คำขอ API Key "${request.api_key_name}" ได้รับการอนุมัติแล้ว</p>
            <p>อีเมลแจ้งเตือนถูกส่งไปยังผู้ขอแล้ว</p>
            <button class="close" onclick="window.close()">ปิด</button>
          </div>
        </body>
        </html>
      `);
    }

    return res.json({ 
      request: { ...request, status: 'approved' },
      apiKey: keyResult.rows[0]
    });
  } finally {
    client.release();
  }
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Admin: Reject API key request
app.post('/api/admin/requests/:id/reject', async (req, res) => {
  try {
    const session = verify(parseCookies(req).session);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

  const requestId = req.params.id;
  const client = await pool.connect();
  try {
    const reqRow = await client.query('SELECT * FROM api_key_requests WHERE id = $1', [requestId]);
    if (reqRow.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const r = reqRow.rows[0];
    await client.query('INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)', [r.user_id, 'คำขอถูกปฏิเสธ', `คำขอ "${r.api_key_name}" ถูกปฏิเสธโดยผู้ดูแลระบบ`]);
    await client.query('DELETE FROM api_key_requests WHERE id = $1', [requestId]);
    // notify rejection
    const lines = [
      'คำขอ API Key ถูกปฏิเสธ',
      `ชื่อคีย์: ${r.api_key_name}`,
      `ผู้ขอ: ${r.first_name} ${r.last_name} (${r.email})`,
      `คณะ/หน่วยงาน: ${r.department || '-'}`
    ];
    sendNotifyMessage(lines.join('\n')).catch(() => {});
    return res.json({ success: true });
  } finally {
    client.release();
  }
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Admin: Get settings
app.get('/api/admin/settings', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT key, value, description FROM admin_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = {
        value: row.value,
        description: row.description
      };
    });
    res.json({ settings });
  } catch (e) {
    console.error('Error fetching admin settings:', e);
    res.status(500).json({ error: 'Failed to fetch settings' });
  } finally {
    client.release();
  }
});

// Admin: Update settings
app.patch('/api/admin/settings', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { key, value } = req.body || {};
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'key and value are required' });
  }
  const client = await pool.connect();
  try {
    console.log('🔧 [admin/settings] Updating setting:', key, '=', value);
    const result = await client.query(`
      INSERT INTO admin_settings (key, value, updated_at)
      VALUES ($1, $2, timezone('Asia/Bangkok', now()))
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = timezone('Asia/Bangkok', now())
      RETURNING key, value, updated_at
    `, [key, String(value)]);
    
    console.log('✅ [admin/settings] Setting saved:', result.rows[0]);
    
    // Verify the save
    const verifyResult = await client.query(
      'SELECT key, value FROM admin_settings WHERE key = $1',
      [key]
    );
    console.log('🔍 [admin/settings] Verified setting:', verifyResult.rows[0]);
    
    res.json({ success: true, setting: result.rows[0] });
  } catch (e) {
    console.error('❌ Error updating admin settings:', e);
    res.status(500).json({ error: 'Failed to update settings', details: e?.message });
  } finally {
    client.release();
  }
});

// Admin: Auto-disable inactive API keys
app.post('/api/admin/auto-disable-inactive', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const client = await pool.connect();
  try {
    // Get auto-disable days setting
    const settingResult = await client.query(
      'SELECT value FROM admin_settings WHERE key = $1',
      ['auto_disable_inactive_days']
    );
    const days = Number(settingResult.rows[0]?.value || 30);
    
    // Find inactive keys (no usage in the last N days and is_active = true)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const inactiveKeys = await client.query(`
      SELECT ak.id, ak.name, ak.user_id, ak.last_used_at, ak.created_at, u.fullname, u.email
      FROM api_keys ak
      LEFT JOIN users u ON ak.user_id = u.id
      WHERE ak.is_active = true
      AND (
        ak.last_used_at IS NULL 
        OR ak.last_used_at < $1
      )
      AND ak.created_at < $1
    `, [cutoffDate]);
    
    let disabledCount = 0;
    for (const key of inactiveKeys.rows) {
      await client.query(
        'UPDATE api_keys SET is_active = false, updated_at = timezone(\'Asia/Bangkok\', now()) WHERE id = $1',
        [key.id]
      );
      
      // Create notification for user
      await client.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [key.user_id, 'API Key ถูกปิดการใช้งานอัตโนมัติ', `API Key "${key.name}" ถูกปิดการใช้งานอัตโนมัติเนื่องจากไม่ได้ใช้งานเป็นเวลา ${days} วัน`]
      );
      
      disabledCount++;
    }
    
    res.json({ 
      success: true, 
      disabled_count: disabledCount,
      days: days,
      message: `ปิดการใช้งาน ${disabledCount} API keys ที่ไม่ได้ใช้งานเป็นเวลา ${days} วัน`
    });
  } catch (e) {
    console.error('Error auto-disabling inactive keys:', e);
    res.status(500).json({ error: 'Failed to auto-disable inactive keys' });
  } finally {
    client.release();
  }
});

// Get unread notifications for current user
app.get('/api/notifications', async (req, res) => {
  const session = verify(parseCookies(req).session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, title, message, (created_at + INTERVAL '7 hour') as created_at FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC`,
      [session.user.id]
    );
    res.json({ notifications: result.rows });
  } finally {
    client.release();
  }
});

// Mark notifications as read
app.patch('/api/notifications/read', async (req, res) => {
  const session = verify(parseCookies(req).session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const client = await pool.connect();
  try {
    await client.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [session.user.id]);
    res.json({ success: true });
  } finally {
    client.release();
  }
});

// Admin: Test OpenRouter connectivity/status
app.get('/api/admin/openrouter/status', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const list = await orListKeys();
    return res.json({ ok: true, keysVisible: list.length, hasToken: Boolean(OPENROUTER_TOKEN) });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
});

// Issue API token for current user
app.post('/api/tokens', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name = 'personal token', expiresInDays } = req.body || {};
  const rawToken = 'ubu_' + crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 86400000) : null;
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO api_user_tokens (user_id, name, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, expires_at, created_at
    `, [session.user.id, name, tokenHash, expiresAt]);
    return res.json({ token: rawToken, meta: result.rows[0] });
  } finally {
    client.release();
  }
});

// List tokens (metadata only)
app.get('/api/tokens', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, is_active, expires_at, created_at, last_used_at
      FROM api_user_tokens WHERE user_id = $1 ORDER BY created_at DESC
    `, [session.user.id]);
    return res.json({ tokens: result.rows });
  } finally {
    client.release();
  }
});

// Revoke token
app.delete('/api/tokens/:id', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('UPDATE api_user_tokens SET is_active = false WHERE id = $1 AND user_id = $2', [id, session.user.id]);
    return res.json({ success: true });
  } finally {
    client.release();
  }
});

// --- Dev2 public v1 compatibility endpoints ---
// Always enable for dev2 compatibility (can be disabled with PUBLIC_V1_ENABLED=false)
const shouldEnableV1 = String(process.env.PUBLIC_V1_ENABLED || 'true').toLowerCase();
const enableV1 = shouldEnableV1 !== 'false';

if (enableV1) {
  console.log('✅ Public v1 endpoints enabled (dev2 compatibility)');

  const forwardToOpenRouter = async (req, res, targetUrl) => {
    try {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_bearer_token' });
      const token = auth.slice('Bearer '.length).trim();
      
      // Resolve actual OpenRouter key from gateway API key
      let useKey = token;
      let keyId = null;
      let userId = null;
      const client = await pool.connect();
      try {
        // Check if this is a gateway key (starts with ubu_)
        if (token.startsWith('ubu_')) {
          const keyHash = crypto.createHash('sha256').update(token).digest('hex');
          const result = await client.query(
            'SELECT id, user_id, provider_key_value, provider, is_active, credit_limit FROM api_keys WHERE key_hash = $1',
            [keyHash]
          );
          
          if (result.rows.length === 0) {
            return res.status(401).json({ error: 'invalid_api_key' });
          }
          
          const key = result.rows[0];
          keyId = key.id;
          userId = key.user_id;
          
          if (!key.is_active) {
            return res.status(403).json({ error: 'key_disabled', message: 'This API key has been disabled' });
          }
          
          // Check credit limit - get current usage
          const usageQuery = await client.query(`
            SELECT COALESCE(SUM(cost_usd), 0) as total_used
            FROM api_usage_logs
            WHERE api_key_id = $1
          `, [keyId]);
          const totalUsed = Number(usageQuery.rows[0]?.total_used || 0);
          const creditLimit = Number(key.credit_limit || 0);
          const remaining = creditLimit - totalUsed;
          
          // If credit limit is 0 or exhausted, reject the request
          if (creditLimit > 0 && remaining <= 0) {
            // Auto-disable the key if credit is exhausted
            await client.query('UPDATE api_keys SET is_active = false WHERE id = $1', [keyId]);
            return res.status(403).json({ 
              error: 'credit_exhausted', 
              message: 'Credit limit has been reached. This API key has been automatically disabled.',
              used: totalUsed,
              limit: creditLimit
            });
          }
          
          // If credit limit is 0, reject (but don't auto-disable as it might be intentional)
          if (creditLimit === 0) {
            return res.status(403).json({ 
              error: 'credit_limit_zero', 
              message: 'Credit limit is set to 0. Please set a credit limit to use this API key.',
              used: totalUsed,
              limit: creditLimit
            });
          }
          
          console.log(`   💰 Credit check: $${totalUsed.toFixed(4)} / $${creditLimit.toFixed(2)} (remaining: $${remaining.toFixed(4)})`);
          
          // Use provider key if available
          useKey = key.provider_key_value;
          
          // Auto-provision provider key if missing (only once, don't retry on subsequent requests)
          // Check if we've already attempted provisioning by looking for a flag or just use global token
          if (!useKey) {
            if (OPENROUTER_TOKEN) {
              // Check if provisioning was attempted before (marked by checking if key has been used with global token)
              // For now, just use global token directly to avoid repeated provisioning attempts
              useKey = OPENROUTER_TOKEN;
              console.log(`   ℹ️ Gateway key ${keyId} has no provider key, using global OPENROUTER_TOKEN`);
              console.log(`   💡 Tip: To enable dedicated provider keys, ensure OPENROUTER_TOKEN has provisioning permissions`);
            } else {
              // No provider key and no global token
              return res.status(401).json({ 
                error: 'provider_key_missing', 
                message: 'API key not configured with provider access. Please contact administrator.' 
              });
            }
          } else {
            console.log(`   ✅ Using dedicated provider key for gateway key ${keyId}`);
          }
        } else {
          // Not a gateway key, use as-is (might be direct OpenRouter key)
          console.log('   Using provided token as direct provider key');
        }
      } finally {
        client.release();
      }
      
      const { data } = await axios.post(targetUrl, req.body || {}, {
        headers: {
          Authorization: `Bearer ${useKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'https://dev2.ubu.ac.th/ai_gateway/',
          'X-Title': 'UBU AI FLOW (dev2)'
        },
        timeout: 30000
      });
      
      // Log usage if this was a gateway key
      if (token.startsWith('ubu_') && keyId && userId) {
        try {
          const usage = data?.usage || {};
          const tokensIn = Number(usage?.prompt_tokens || usage?.input_tokens || 0);
          const tokensOut = Number(usage?.completion_tokens || usage?.output_tokens || 0);
          const cost = Number(usage?.total_cost || 0);
          const client2 = await pool.connect();
          try {
            await client2.query(`
              INSERT INTO api_usage_logs (api_key_id, user_id, provider, action, model, tokens_input, tokens_output, cost_usd, status_code, response_time_ms)
              VALUES ($1, $2, 'openrouter', 'chat.completions', $3, $4, $5, $6, 200, 0)
            `, [keyId, userId, data?.model || req.body?.model || 'unknown', tokensIn, tokensOut, cost]);
            
            // Update last_used_at for the API key
            await client2.query('UPDATE api_keys SET last_used_at = timezone(\'Asia/Bangkok\', now()) WHERE id = $1', [keyId]);
            console.log(`   📊 Logged usage: ${tokensIn + tokensOut} tokens, $${cost.toFixed(4)}`);
          } finally {
            client2.release();
          }
        } catch (e) {
          console.warn('   ⚠️ Usage logging failed:', e?.message || e);
        }
      }
      
      return res.json(data);
    } catch (e) {
      const status = e?.response?.status || 500;
      return res.status(status).json({ error: 'provider_error', details: e?.response?.data || e?.message });
    }
  };

  // POST /api/v1/chat/completions
  app.post('/api/v1/chat/completions', async (req, res) => {
    console.log('📥 POST /api/v1/chat/completions - Request received');
    console.log('   Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('   Body:', JSON.stringify(req.body || {}).substring(0, 200));
    return forwardToOpenRouter(req, res, 'https://openrouter.ai/api/v1/chat/completions');
  });

  // POST /api/v1/images/generations
  app.post('/api/v1/images/generations', async (req, res) => {
    console.log('📥 POST /api/v1/images/generations - Request received');
    return forwardToOpenRouter(req, res, 'https://openrouter.ai/api/v1/images');
  });

  console.log('   📍 POST /api/v1/chat/completions');
  console.log('   📍 POST /api/v1/images/generations');
} else {
  console.log('ℹ️  Public v1 endpoints disabled (set PUBLIC_V1_ENABLED=true to enable)');
}

app.listen(PORT, async () => {
  await ensureSchema().catch(err => console.error('Schema ensure failed:', err));
  // Initial cleanup and schedule daily cleanup of stale pending requests
  try { await cleanupOldPendingRequests(); } catch (e) { console.warn('Initial cleanup failed:', e?.message || e); }
  setInterval(() => {
    cleanupOldPendingRequests().catch(() => {});
  }, 24 * 60 * 60 * 1000);
  console.log('🚀 ===========================================');
  console.log('🚀 UBU AI Gateway Backend Started');
  console.log('🚀 ===========================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/oauth-login`);
  console.log(`👤 Me: http://localhost:${PORT}/api/me`);
  console.log(`🔑 Keys: http://localhost:${PORT}/api/keys`);
  console.log(`🌉 Gateway: http://localhost:${PORT}/gateway/:provider/:action`);
  console.log('🚀 ===========================================');
});


