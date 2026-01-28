 
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

// --- CORS (allow local + aigateway domain) ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://aigateway.ubu.ac.th')
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

// IP Whitelist middleware for API security
// Allow IPs from environment variable or use defaults
const allowedIPsEnv = process.env.ALLOWED_IPS || '192.168.176.1,202.28.49.204,192.168.10.24,35.193.131.93';
const allowedIPs = allowedIPsEnv.split(',').map(ip => ip.trim()).filter(Boolean);
const IP_WHITELIST_ENABLED = process.env.IP_WHITELIST_ENABLED === 'true'; // Default to disabled (set IP_WHITELIST_ENABLED=true to enable)

// Helper function to get client IP
function getClientIP(req) {
  // Check various headers for client IP (when behind proxy/load balancer)
  // Priority: x-forwarded-for > x-real-ip > cf-connecting-ip > req.ip > connection.remoteAddress
  
  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
  // Take the first one which is the original client IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    const firstIP = ips[0];
    if (firstIP) {
      // Remove port if present (e.g., "192.168.1.1:12345" -> "192.168.1.1")
      return firstIP.split(':')[0];
    }
  }
  
  // Check x-real-ip header (common in nginx)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP.split(':')[0];
  }
  
  // Check Cloudflare connecting IP
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) {
    return cfIP.split(':')[0];
  }
  
  // Fallback to req.ip (works with trust proxy setting)
  if (req.ip) {
    return req.ip.split(':')[0];
  }
  
  // Last resort: connection remoteAddress
  const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddr) {
    return remoteAddr.split(':')[0];
  }
  
  return null;
}

// IP whitelist middleware - apply to all API routes except health checks and OAuth
app.use((req, res, next) => {
  // Skip IP check for health endpoints
  if (req.path === '/health' || req.path === '/api/echo') {
    return next();
  }
  
  // Skip IP check for OAuth endpoints (login, callback)
  if (req.path === '/api/oauth-login' || req.path === '/api/oauth/callback' || req.path.startsWith('/api/oauth')) {
    return next();
  }
  
  // Skip IP check if whitelist is disabled
  if (!IP_WHITELIST_ENABLED) {
    return next();
  }
  
  const clientIP = getClientIP(req);
  
  // Always allow localhost for development
  const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost' || 
                      req.ip === '::1' || req.ip === '127.0.0.1' ||
                      req.connection?.remoteAddress === '::1' || req.connection?.remoteAddress === '127.0.0.1';
  
  if (isLocalhost) {
    console.log(`✅ Allowed localhost access (path: ${req.path})`);
    return next();
  }
  
  // Debug logging to help troubleshoot IP issues
  if (!clientIP) {
    console.warn(`⚠️ Could not determine client IP for path: ${req.path}`);
    console.warn(`   Headers: x-forwarded-for=${req.headers['x-forwarded-for']}, x-real-ip=${req.headers['x-real-ip']}, req.ip=${req.ip}`);
  }
  
  // Check if IP is in whitelist
  if (!clientIP || !allowedIPs.includes(clientIP)) {
    console.warn(`🚫 Blocked API access from unauthorized IP: ${clientIP || 'unknown'} (path: ${req.path})`);
    console.warn(`   Allowed IPs: ${allowedIPs.join(', ')}`);
    console.warn(`   Detected IP sources: x-forwarded-for=${req.headers['x-forwarded-for'] || 'none'}, x-real-ip=${req.headers['x-real-ip'] || 'none'}, req.ip=${req.ip || 'none'}`);
    return res.status(403).json({ 
      error: 'access_denied', 
      message: 'Access denied. Your IP address is not authorized to access this API.',
      detected_ip: clientIP || 'unknown',
      allowed_ips: allowedIPs
    });
  }
  
  // Log allowed access for monitoring
  console.log(`✅ Allowed API access from IP: ${clientIP} (path: ${req.path})`);
  next();
});

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const OPENROUTER_TOKEN = process.env.OPENROUTER_TOKEN || '';
const NOTIFY_URL = process.env.NOTIFY_URL || 'https://dev2.ubu.ac.th/api_notify/send_message';
const NOTIFY_SPACE = process.env.NOTIFY_SPACE || '';
const NOTIFY_TOKEN = process.env.NOTIFY_TOKEN || '';
const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';
const GOOGLE_CHAT_API_KEY = process.env.GOOGLE_CHAT_API_KEY || '';
const BASE_URL = process.env.BASE_URL || 'https://dev2.ubu.ac.th';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''; // n8n webhook URL for invite tracking

// simple in-memory cache for public data
const modelsCache = { data: null, ts: 0 };
const MODELS_CACHE_MS = process.env.NODE_ENV === 'production' ? (10 * 60 * 1000) : (10 * 1000);
// Auto-refresh interval: 1 week in milliseconds (refresh weekly to catch new models)
const MODELS_AUTO_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 1 week (7 days)

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
    
    console.log('📤 Sending notification...');
    // Increase timeout to 15 seconds and make it fire-and-forget
    await axios.post(NOTIFY_URL, payload, { timeout: 15000 });
    console.log('✅ Notification sent successfully');
  } catch (e) {
    // Only log if it's not a timeout (timeouts are common and not critical)
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      console.warn('⚠️ Notification timeout (non-critical)');
    } else {
      console.warn('❌ notify failed:', e?.response?.status || '', e?.response?.data || e?.message);
    }
    // If buttons format fails, try sending just the message
    if (buttons && buttons.length > 0) {
      try {
        await axios.post(NOTIFY_URL, {
          message,
          space: NOTIFY_SPACE,
          token: NOTIFY_TOKEN,
        }, { timeout: 15000 });
        console.log('✅ Fallback: Sent notification without buttons');
      } catch (e2) {
        if (e2.code === 'ECONNABORTED' || e2.message?.includes('timeout')) {
          console.warn('⚠️ Fallback notification timeout (non-critical)');
        } else {
          console.warn('❌ Fallback notify also failed:', e2?.message);
        }
      }
    }
  }
}


// Helper: fetch real pricing for a model from OpenRouter (per 1M tokens), with cache
async function getModelPricingPerM(modelId, forceRefresh = false) {
  try {
    const now = Date.now();
    // refresh cache if stale, empty, or forced
    if (forceRefresh || !modelsCache.data || now - modelsCache.ts >= MODELS_CACHE_MS) {
      if (!OPENROUTER_TOKEN) {
        console.warn('⚠️ OPENROUTER_TOKEN not set, cannot fetch pricing from OpenRouter');
        return null;
      }
      try {
        console.log('🔄 Fetching pricing from OpenRouter API...');
        const resp = await axios.get('https://openrouter.ai/api/v1/models', {
          headers: {
            Authorization: `Bearer ${OPENROUTER_TOKEN}`,
            'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
            'X-Title': 'UBU AI SERVICE'
          },
          timeout: 10000 // 10 second timeout
        });
        const items = Array.isArray(resp.data?.data) ? resp.data.data : [];
        console.log(`✅ Fetched ${items.length} models from OpenRouter`);
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
        console.log(`💾 Cached ${models.length} models with pricing`);
      } catch (error) {
        console.error('❌ Error fetching pricing from OpenRouter:', error?.message || error);
        // If cache exists, use it even if stale
        if (modelsCache.data && modelsCache.data.length > 0) {
          console.log('⚠️ Using stale cache due to fetch error');
        } else {
          return null;
        }
      }
    }
    
    if (!modelsCache.data || modelsCache.data.length === 0) {
      console.warn('⚠️ No pricing data available in cache');
      return null;
    }
    
    const mId = String(modelId || '').toLowerCase();
    
    // Try multiple matching strategies:
    // 1. Exact match (case-insensitive)
    let found = (modelsCache.data || []).find(m => String(m.id || '').toLowerCase() === mId);
    
    // 2. Partial match (model ID contains search term)
    if (!found) {
      found = (modelsCache.data || []).find(m => {
        const modelIdLower = String(m.id || '').toLowerCase();
        return mId && (modelIdLower.includes(mId) || mId.includes(modelIdLower));
      });
    }
    
    // 3. Match without provider prefix (e.g., "gemini-2.5-flash" matches "google/gemini-2.5-flash")
    if (!found && mId.includes('/')) {
      const modelNameOnly = mId.split('/').pop();
      found = (modelsCache.data || []).find(m => {
        const modelIdLower = String(m.id || '').toLowerCase();
        return modelIdLower.endsWith('/' + modelNameOnly) || modelIdLower === modelNameOnly;
      });
    }
    
    // 4. Match provider/model separately (e.g., "google/gemini-2.5-flash" matches "gemini-2.5-flash")
    if (!found && !mId.includes('/')) {
      found = (modelsCache.data || []).find(m => {
        const modelIdLower = String(m.id || '').toLowerCase();
        return modelIdLower.endsWith('/' + mId) || modelIdLower.split('/').pop() === mId;
      });
    }
    
    if (!found) {
      console.warn(`⚠️ Pricing not found for model: ${modelId} (searched in ${modelsCache.data.length} cached models)`);
      return null;
    }
    
    const inM = Number(found?.pricing?.prompt_usd_per_m);
    const outM = Number(found?.pricing?.completion_usd_per_m);
    
    // For embedding models, outM might be null/0, which is OK
    if (!Number.isFinite(inM)) {
      console.warn(`⚠️ Invalid pricing for model ${modelId}: inM=${inM}, outM=${outM}`);
      return null;
    }
    
    // If outM is not finite, set to 0 (for embedding models)
    const finalOutM = Number.isFinite(outM) ? outM : 0;
    
    console.log(`✅ Found pricing for ${modelId}: inM=$${inM}/M, outM=$${finalOutM}/M`);
    return { inM, outM: finalOutM };
  } catch (error) {
    console.error(`❌ Error in getModelPricingPerM for ${modelId}:`, error?.message || error);
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
  
  // For localhost, allow fallback if database connection fails
  const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
  const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  const { q = '', department = '' } = req.query || {};
  
  try {
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
    } finally {
      client.release();
    }
  } catch (dbError) {
    // For localhost, allow fallback without database
    // Log the actual database error for debugging
    console.error('❌ Database error in /api/admin/keys:', dbError?.message || dbError);
    // Always throw error - no fallback mode (use real database)
    res.status(500).json({ error: 'Failed to list keys', message: dbError?.message || 'Database connection failed' });
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
        credit_limit DECIMAL(10,2) DEFAULT 5.00,
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
        credit_limit DECIMAL(10,2) DEFAULT 5.00,
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
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 5.00;`);
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
      { 
        headers: { Authorization: `Bearer ${OPENROUTER_TOKEN}` },
        timeout: 10000
      }
    );
    // try common shapes
    const value = data?.key?.value || data?.value || data?.key || null;
    const usage = Number(data?.key?.usage || 0);
    const limit = Number(data?.key?.limit || limitUSD || 0);
    return { value, usage, limit };
  } catch (e) {
    // Only log non-401 errors (401 means invalid/expired provisioning key, which is expected in some setups)
    // When 401 occurs, the system will fallback to using local keys or the global OPENROUTER_TOKEN
    if (e.response && e.response.status !== 401) {
      console.warn('OpenRouter create key failed:', e.response.status, e.response.data?.message || e.response.data || '');
    } else if (e.response && e.response.status === 401) {
      // Silently ignore 401 errors - this is expected if OPENROUTER_TOKEN is not a provisioning key
      // or if provisioning is not enabled. The system will use fallback mechanisms.
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
      headers: { Authorization: `Bearer ${OPENROUTER_TOKEN}` },
      timeout: 10000
    });
    const items = data?.data || data?.keys || [];
    return items;
  } catch (e) {
    // Only log non-401 errors (401 means invalid/expired provisioning key, which is expected in some setups)
    if (e.response && e.response.status !== 401) {
      console.warn('OpenRouter list error:', e.response.status, e.response.data?.message || e.response.data || '');
    } else if (e.response && e.response.status === 401) {
      // Silently ignore 401 errors - this is expected if OPENROUTER_TOKEN is not a provisioning key
      // or if provisioning is not enabled
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
// ตอนนี้รองรับทั้ง API บุคลากรเดิม และ API นักศึกษาที่ดึงจาก UBU account
// แล้ว merge ข้อมูลเข้าด้วยกันก่อน cache
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

  // URL หลัก (บุคลากร / เจ้าหน้าที่)
  const hrStaffUrl =
    process.env.HR_API_URL ||
    'https://dev.ubu.ac.th/api_hr/get_person_name';

  // URL สำหรับนักศึกษา (ดึงจาก UBU account โดยตรง)
  const hrStudentUrl =
    process.env.HR_STUDENT_API_URL ||
    'https://dev.ubu.ac.th/api_hr/get_person_name_ubuaccount';

  try {
    console.log('🔄 Fetching fresh HR data from APIs:', {
      staffUrl: hrStaffUrl,
      studentUrl: hrStudentUrl
    });

    const [staffResp, studentResp] = await Promise.allSettled([
      axios.get(hrStaffUrl),
      axios.get(hrStudentUrl)
    ]);

    let combined = [];

    if (staffResp.status === 'fulfilled' && Array.isArray(staffResp.value.data)) {
      console.log(`✅ HR staff data fetched: ${staffResp.value.data.length} records`);
      combined = combined.concat(staffResp.value.data);
    } else if (staffResp.status === 'rejected') {
      console.error('❌ Error fetching HR staff data:', staffResp.reason?.message || staffResp.reason);
    }

    if (studentResp.status === 'fulfilled' && Array.isArray(studentResp.value.data)) {
      console.log(`✅ HR student data fetched: ${studentResp.value.data.length} records`);
      combined = combined.concat(studentResp.value.data);
    } else if (studentResp.status === 'rejected') {
      console.error('❌ Error fetching HR student data:', studentResp.reason?.message || studentResp.reason);
    }

    if (!combined.length) {
      console.error('❌ No HR data fetched from either staff or student API');
      // ถ้า cache เก่ามีอยู่ ให้ใช้ cache เก่า
      if (hrApiCache.data) {
        console.log('⚠️ Using stale HR cache due to API error');
        return hrApiCache.data;
      }
      throw new Error('HR APIs returned no data');
    }

    // รวมข้อมูล โดยให้ key หลักคือ ubuaccount หรือ email เพื่อลด duplicate
    const seen = new Map();
    for (const row of combined) {
      const key =
        (row.ubuaccount || row.account || row.username || row.email || '').toLowerCase();
      if (!key) continue;
      if (!seen.has(key)) {
        seen.set(key, row);
      } else {
        // ถ้ามีทั้ง staff และ student สำหรับคนเดียวกัน ให้ merge field แบบง่ายๆ
        const existing = seen.get(key);
        seen.set(key, { ...existing, ...row });
      }
    }

    const mergedData = Array.from(seen.values());

    hrApiCache.data = mergedData;
    hrApiCache.lastFetch = now;
    console.log(`✅ HR data cached (staff + students): ${mergedData.length} unique records`);

    // Log sample record structure for debugging
    if (mergedData.length > 0) {
      console.log('📋 Sample HR record fields:', Object.keys(mergedData[0]));
      console.log(
        '📋 Sample HR record (first 3 keys):',
        Object.fromEntries(Object.entries(mergedData[0]).slice(0, 3))
      );
    }

    return mergedData;
  } catch (error) {
    console.error('❌ Error fetching HR data:', error.message || error);
    console.error('   Staff URL attempted:', hrStaffUrl);
    console.error('   Student URL attempted:', hrStudentUrl);
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
    
    // Find user in HR data - search by ubuaccount, personcode (รหัสนักศึกษา/บุคลากร) หรือ email
    const userData = hrDataList.find(user => {
      const userAccount = user.ubuaccount || user.account || user.username || '';
      const userPersoncode = user.personcode || user.person_code || user.personCode || '';
      const userEmail = user.email || '';
      const normalizedUsername = username.toLowerCase();
      return userAccount.toLowerCase() === normalizedUsername || 
             userPersoncode.toLowerCase() === normalizedUsername ||
             userEmail.toLowerCase() === normalizedUsername ||
             userEmail.toLowerCase() === `${normalizedUsername}@ubu.ac.th`;
    });
    
    let finalUserData = userData;
    
    if (!finalUserData) {
      console.log(`❌ User ${username} not found in cached HR list (searched ${hrDataList.length} records), trying student API by keyword...`);
      
      // Fallback: call HR_STUDENT_API_URL แบบระบุ keyword (เช่น /get_person_name_ubuaccount?keyword=66114540193)
      try {
        let hrStudentBaseUrl =
          process.env.HR_STUDENT_API_URL ||
          'https://dev.ubu.ac.th/api_hr/get_person_name_ubuaccount';

        // รองรับทั้งสองรูปแบบ config:
        // 1) .../get_person_name_ubuaccount
        // 2) .../get_person_name_ubuaccount?keyword=
        let studentUrl;
        if (hrStudentBaseUrl.includes('keyword=')) {
          // ถ้ามี keyword= อยู่แล้ว ให้ต่อ username ไปตรง ๆ
          studentUrl = `${hrStudentBaseUrl}${encodeURIComponent(username)}`;
        } else {
          const separator = hrStudentBaseUrl.includes('?') ? '&' : '?';
          studentUrl = `${hrStudentBaseUrl}${separator}keyword=${encodeURIComponent(username)}`;
        }
        
        console.log('🔄 [HR fallback] Fetching student info by keyword from:', studentUrl);
        const resp = await axios.get(studentUrl);
        const raw = resp.data;
        
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        
        if (list.length > 0) {
          finalUserData = list[0];
          console.log(`✅ [HR fallback] Found student record for ${username} via keyword API`, {
            faculty_name: finalUserData.faculty_name,
            department_name: finalUserData.department_name,
            ubuaccount: finalUserData.ubuaccount,
            personcode: finalUserData.personcode
          });
        } else {
          console.log(`❌ [HR fallback] Student API returned no data for keyword=${username}`);
        }
      } catch (fallbackErr) {
        console.error(`❌ [HR fallback] Error calling student keyword API for ${username}:`, fallbackErr?.message || fallbackErr);
      }
    }
    
    if (!finalUserData) {
      console.log(`❌ User ${username} not found in HR system (including student keyword API)`);
      // Log sample record to see structure
      if (hrDataList.length > 0) {
        console.log('📋 Sample HR record structure:', Object.keys(hrDataList[0]));
      }
      return null;
    }
    
    console.log(`✅ Found HR data for ${username}:`, {
      faculty: finalUserData.faculty || finalUserData.faculty_name,
      department: finalUserData.department_name || finalUserData.department,
      allFields: Object.keys(finalUserData),
      rawData: finalUserData // Log full record for debugging
    });
    
    // Map HR data to our expected format - check multiple possible field names
    const mappedHr = {
      ubuaccount: finalUserData.ubuaccount || finalUserData.account || finalUserData.username || username,
      prefix_name: finalUserData.prefix_name || finalUserData.prefix || 'นาย',
      fname: finalUserData.fname || finalUserData.firstName || finalUserData.first_name || '',
      lname: finalUserData.lname || finalUserData.lastName || finalUserData.last_name || '',
      faculty: finalUserData.faculty || finalUserData.faculty_name || finalUserData.facultyName || '',
      department_name: finalUserData.department_name || finalUserData.department || finalUserData.departmentName || '',
      email: finalUserData.email || `${username}@ubu.ac.th`,
      position: finalUserData.positiontype_name || finalUserData.position || finalUserData.positionName || '',
      status: 'active',
      personcode: finalUserData.personcode || finalUserData.person_code || finalUserData.personCode || '',
      level_name: finalUserData.level_name || finalUserData.levelName || ''
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
    // ไม่ใช้ mock data แล้ว ให้ caller จัดการเอง (เช่น แสดง "ไม่ระบุ" หรือต้องกรอกเอง)
    return null;
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

// Helper function to fetch and process models from OpenRouter
async function fetchModelsFromOpenRouter() {
  if (!OPENROUTER_TOKEN) {
    console.warn('⚠️ OPENROUTER_TOKEN not set, cannot fetch models');
    return [];
  }
  
  try {
    console.log('🔄 Fetching all models from OpenRouter API...');
    
    // Fetch all models (OpenRouter API returns all models in one call, including embeddings)
    // We can also try with output_modalities filter to ensure we get embeddings
    // Get all models - OpenRouter API returns all models in one call (no pagination)
    // But we'll log the response structure to debug why we're only getting 347 instead of 617
    // Try multiple approaches to get all models
    const allModelsRequest = axios.get('https://openrouter.ai/api/v1/models', {
      params: {
        // Try without any params first - OpenRouter may filter based on API key
        // Some models may require explicit access requests
      },
      headers: {
        Authorization: `Bearer ${OPENROUTER_TOKEN}`,
        'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
        'X-Title': 'UBU AI SERVICE',
        'Accept': 'application/json'
      },
      timeout: 60000, // Increase timeout for large response (60 seconds)
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Also try to get models filtered by output_modalities=embeddings
    const embeddingsRequest = axios.get('https://openrouter.ai/api/v1/models', {
      params: {
        output_modalities: 'embeddings'
      },
      headers: {
        Authorization: `Bearer ${OPENROUTER_TOKEN}`,
        'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
        'X-Title': 'UBU AI SERVICE'
      },
      timeout: 30000
    }).catch(err => {
      // If filtered endpoint fails, that's okay - we'll use all models
      console.log('ℹ️  Filtered embeddings endpoint failed, will use all models:', err?.message);
      return null;
    });
    
    // Fetch all models and embeddings in parallel
    const [allModelsResp, embeddingsResp] = await Promise.allSettled([
      allModelsRequest,
      embeddingsRequest
    ]);
    
    // Parse response - OpenRouter API returns {"data": [...]}
    // axios wraps it so response.data = {"data": [...]}, so we need response.data.data
    let allModelsItems = [];
    if (allModelsResp.status === 'fulfilled') {
      const axiosResponse = allModelsResp.value;
      const responseBody = axiosResponse?.data; // This is the JSON body from OpenRouter
      
      // OpenRouter returns: {"data": [...]}
      // So axiosResponse.data = {"data": [...]}
      // Therefore: axiosResponse.data.data = [...]
      if (responseBody && typeof responseBody === 'object') {
        if (Array.isArray(responseBody.data)) {
          // Standard OpenRouter format: {"data": [...]}
          allModelsItems = responseBody.data;
          console.log(`✅ Parsed ${allModelsItems.length} models from response.data.data`);
        } else if (Array.isArray(responseBody)) {
          // Direct array (unlikely but handle it)
          allModelsItems = responseBody;
          console.log(`✅ Parsed ${allModelsItems.length} models from response.data (direct array)`);
        } else {
          console.warn(`⚠️  Unexpected response structure. response.data keys:`, Object.keys(responseBody || {}));
          console.warn(`   Response body sample:`, JSON.stringify(responseBody).substring(0, 200));
        }
      }
    }
    
    // Debug: Log what we parsed
    if (allModelsItems.length > 0) {
      const sampleIds = allModelsItems.slice(0, 20).map(m => m?.id).filter(Boolean);
      console.log(`📋 Sample model IDs (first 20): ${sampleIds.join(', ')}`);
      
      // Check for embedding models in the response
      // Comprehensive embedding detection
      const embeddingInResponse = allModelsItems.filter(m => {
        const id = String(m?.id || '').toLowerCase();
        const arch = m?.architecture || {};
        const outputMods = Array.isArray(arch?.output_modalities) ? arch.output_modalities : [];
        
        // Check ID patterns
        const idMatch = id.includes('embedding') || 
               id.includes('embed-') || 
               id.includes('text-embedding') ||
               id.includes('voyage') ||
               id.includes('nomic-embed') ||
               id.includes('jina-embed') ||
               id.includes('bge-') ||
               id.includes('multilingual-e5') ||
               id.includes('e5-') ||
               id.includes('all-minilm') ||
               id.includes('all-mpnet') ||
               id.includes('m2-bert') ||
               id.includes('sentence-transformers') ||
               id.includes('cohere-embed');
        
        // Check architecture
        const archMatch = outputMods.some(mod => 
          String(mod).toLowerCase().includes('embedding') ||
          String(mod).toLowerCase() === 'embeddings'
        );
        
        return idMatch || archMatch;
      });
      
      console.log(`📊 Embedding models in API response: ${embeddingInResponse.length}`);
      
      if (embeddingInResponse.length > 0) {
        const embeddingIds = embeddingInResponse.slice(0, 10).map(m => m.id);
        console.log(`   📋 Sample embedding model IDs: ${embeddingIds.join(', ')}`);
      } else {
        console.warn(`⚠️  No embedding models found in OpenRouter API response!`);
        console.warn(`   This may indicate:`);
        console.warn(`   1. API key tier doesn't have access to embedding models`);
        console.warn(`   2. Embedding models require explicit access requests`);
        console.warn(`   3. OpenRouter filtered them out based on permissions`);
        
        // Check if we can find any models with embedding-related architecture
        const modelsWithEmbeddingArch = allModelsItems.filter(m => {
          const arch = m?.architecture || {};
          const outputMods = Array.isArray(arch?.output_modalities) ? arch.output_modalities : [];
          return outputMods.some(mod => String(mod).toLowerCase().includes('embed'));
        });
        console.warn(`   Models with embedding in architecture: ${modelsWithEmbeddingArch.length}`);
        
        // Log all model IDs to help debug
        const allIds = allModelsItems.slice(0, 50).map(m => m.id).join(', ');
        console.warn(`   First 50 model IDs from API: ${allIds}`);
      }
    } else if (allModelsResp.status === 'fulfilled') {
      const axiosResponse = allModelsResp.value;
      const responseBody = axiosResponse?.data;
      console.warn(`⚠️  No models parsed from response!`);
      console.warn(`   Response status: ${axiosResponse?.status}`);
      console.warn(`   Response body type: ${typeof responseBody}`);
      console.warn(`   Response body keys: ${responseBody ? Object.keys(responseBody).join(', ') : 'null'}`);
      if (responseBody && typeof responseBody === 'object') {
        console.warn(`   Response body sample:`, JSON.stringify(responseBody).substring(0, 500));
      }
    } else if (allModelsResp.status === 'rejected') {
      const error = allModelsResp.reason;
      console.error(`❌ Failed to fetch models from OpenRouter:`);
      console.error(`   Error message: ${error?.message || error}`);
      console.error(`   Status: ${error?.response?.status || 'N/A'}`);
      console.error(`   Status text: ${error?.response?.statusText || 'N/A'}`);
      console.error(`   Response data:`, error?.response?.data || 'N/A');
      console.error(`   Has OPENROUTER_TOKEN: ${!!OPENROUTER_TOKEN}`);
      console.error(`   Token prefix: ${OPENROUTER_TOKEN ? OPENROUTER_TOKEN.substring(0, 12) + '...' : 'N/A'}`);
      
      if (error?.response?.status === 401) {
        console.error(`   ⚠️  401 Unauthorized: Check if OPENROUTER_TOKEN is valid`);
      } else if (error?.response?.status === 403) {
        console.error(`   ⚠️  403 Forbidden: API key may not have permission to access models`);
      }
    }
    
    // Parse embeddings response - same structure as main response
    let embeddingsItems = [];
    if (embeddingsResp.status === 'fulfilled' && embeddingsResp.value) {
      const responseBody = embeddingsResp.value?.data;
      if (responseBody && typeof responseBody === 'object') {
        if (Array.isArray(responseBody.data)) {
          embeddingsItems = responseBody.data;
        } else if (Array.isArray(responseBody)) {
          embeddingsItems = responseBody;
        }
      }
    }
    
    // Combine both lists, avoiding duplicates (prioritize embeddings list if available)
    const allItemsMap = new Map();
    
    // First add all models
    allModelsItems.forEach(item => {
      if (item && item.id) {
        allItemsMap.set(item.id, item);
      }
    });
    
    // Then add/update with embedding-specific models (they might have more complete data)
    if (embeddingsItems.length > 0) {
      embeddingsItems.forEach(item => {
        if (item && item.id) {
          // Update existing or add new
          allItemsMap.set(item.id, item);
        }
      });
    }
    
    const items = Array.from(allItemsMap.values());
    
    console.log(`📦 Received ${allModelsItems.length} total models from OpenRouter API`);
    if (embeddingsItems.length > 0) {
      console.log(`   📊 Including ${embeddingsItems.length} models from embeddings filter`);
    }
    console.log(`   ✅ Total unique models after merge: ${items.length}`);
    
    // Log model count (no warning for lower counts)
    if (items.length >= 600) {
      console.log(`✅ Successfully fetched ${items.length} models (target: ~617)`);
    } else {
      console.log(`ℹ️  Fetched ${items.length} models (target: ~617, close but may be incomplete)`);
      console.log(`   This might be normal if OpenRouter has filtered some models based on your API key.`);
    }

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

    // Process ALL models without filtering - include everything from OpenRouter
    let embeddingModelCount = 0; // Track embedding models found
    const models = items.map((m, index) => {
      if (!m || !m.id) {
        console.warn('⚠️ Skipping model with missing id:', m);
        return null;
      }
      
      const rawIn = getPrice(m?.pricing?.prompt ?? m?.pricing?.input ?? m?.pricing?.prompt_usd_per_m ?? m?.pricing?.input_token);
      const rawOut = getPrice(m?.pricing?.completion ?? m?.pricing?.output ?? m?.pricing?.completion_usd_per_m ?? m?.pricing?.output_token);
      const pIn = toPerMillion(rawIn);
      const pOut = toPerMillion(rawOut);
      const fmt = (n) => (n === null ? '—' : `$${Number(n).toFixed(3)}/M`);
      // Check if this is an embedding model from architecture/modalities
      const isEmbeddingModel = (() => {
        const id = String(m.id || '').toLowerCase();
        const modalities = String(m?.modalities || m?.input_modalities || '').toLowerCase();
        const architecture = m?.architecture || {};
        const archModality = String(architecture?.modality || '').toLowerCase();
        const outputModalities = Array.isArray(architecture?.output_modalities) 
          ? architecture.output_modalities.map(String).join(' ').toLowerCase()
          : String(architecture?.output_modalities || '').toLowerCase();
        const inputModalities = Array.isArray(architecture?.input_modalities)
          ? architecture.input_modalities.map(String).join(' ').toLowerCase()
          : String(architecture?.input_modalities || '').toLowerCase();
        
        // Check ID patterns (comprehensive list) - expanded
        const idMatch = id.includes('embedding') || 
               id.includes('embed-') ||
               id.includes('text-embedding') ||
               id.includes('gte-') ||
               id.includes('e5-') ||
               id.includes('bge-') ||
               id.includes('voyage') ||
               id.includes('nomic-embed') ||
               id.includes('jina-embed') ||
               id.includes('jina-embeddings') ||
               id.includes('all-minilm') ||
               id.includes('all-mpnet') ||
               id.includes('m2-bert') ||
               id.includes('sentence-transformers') ||
               id.includes('multilingual-e5') ||
               id.includes('cohere-embed') ||
               id.includes('paraphrase-') ||
               id.includes('stella-') ||
               id.includes('gemini-embedding') ||
               id.includes('qwen-embedding') ||
               id.includes('embedding-001') ||
               id.includes('embedding-002') ||
               id.includes('embedding-003') ||
               id.includes('instructor-') ||
               id.includes('thenlper');
        
        // Check architecture fields - be more thorough
        const archMatch = modalities.includes('embedding') ||
               archModality.includes('embedding') ||
               outputModalities.includes('embedding') ||
               outputModalities.includes('embeddings') || // plural form
               outputModalities.includes('vector') ||
               inputModalities.includes('embedding');
        
        // Also check if output_modalities is an array containing 'embeddings'
        const outputModsArray = Array.isArray(architecture?.output_modalities) 
          ? architecture.output_modalities 
          : [];
        const hasEmbeddingInArray = outputModsArray.some(mod => 
          String(mod).toLowerCase() === 'embeddings' || 
          String(mod).toLowerCase() === 'embedding' ||
          String(mod).toLowerCase().includes('embedding')
        );
        
        const result = idMatch || archMatch || hasEmbeddingInArray;
        
        // Debug: Log first few embedding models found
        if (result && embeddingModelCount < 5) {
          embeddingModelCount++;
          console.log(`   🔍 Found embedding model #${embeddingModelCount}: ${m.id}`);
          console.log(`      ID match: ${idMatch}, Arch match: ${archMatch}, Array match: ${hasEmbeddingInArray}`);
          if (outputModsArray.length > 0) {
            console.log(`      Output modalities: ${outputModsArray.join(', ')}`);
          }
          if (architecture?.modality) {
            console.log(`      Modality: ${architecture.modality}`);
          }
        }
        
        return result;
      })();
      
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
        architecture: m?.architecture || null,
        isEmbedding: isEmbeddingModel, // Add flag for easier filtering
        url: `https://openrouter.ai/models/${encodeURIComponent(m.id)}`
      };
    }).filter(m => m !== null); // Remove any null entries
    
    // Log statistics with comprehensive embedding detection
    // Use the isEmbedding flag we added, plus additional pattern matching
    const embeddingModels = models.filter(m => {
      // First check the flag we set during processing
      if (m.isEmbedding) return true;
      
      // Fallback: check ID patterns (comprehensive list)
      const id = String(m.id || '').toLowerCase();
      return id.includes('embedding') || 
             id.includes('embed-') || 
             id.includes('text-embedding') ||
             id.includes('voyage') ||
             id.includes('nomic-embed') ||
             id.includes('jina-embeddings') ||
             id.includes('jina-embed') ||
             id.includes('bge-') ||
             id.includes('multilingual-e5') ||
             id.includes('e5-') ||
             id.includes('all-minilm') ||
             id.includes('all-mpnet') ||
             id.includes('m2-bert') ||
             id.includes('sentence-transformers') ||
             id.includes('paraphrase-') ||
             id.includes('stella-') ||
             id.includes('gemini-embedding') ||
             id.includes('qwen-embedding') ||
             id.includes('cohere-embed') ||
             id.includes('embedding-001') ||
             id.includes('embedding-002') ||
             id.includes('embedding-003') ||
             id.includes('instructor-') ||
             id.includes('gte-') ||
             id.includes('thenlper'); // Add thenlper models (gte-base, gte-large)
    });
    
    const embeddingCount = embeddingModels.length;
    
    console.log(`✅ Processed ${models.length} models from OpenRouter`);
    console.log(`📊 Including ${embeddingCount} embedding models (detected during processing: ${embeddingModelCount})`);
    
    // If no embedding models found, scan all model IDs to see if any match embedding patterns
    if (embeddingCount === 0 && models.length > 0) {
      console.warn(`⚠️  No embedding models detected! Scanning all ${models.length} models for embedding patterns...`);
      
      // Check all model IDs for embedding-related patterns
      const potentialEmbeddings = models.filter(m => {
        const id = String(m.id || '').toLowerCase();
        return id.includes('embed') || id.includes('vector') || id.includes('similarity');
      });
      
      if (potentialEmbeddings.length > 0) {
        console.warn(`   Found ${potentialEmbeddings.length} models with 'embed'/'vector'/'similarity' in ID:`);
        potentialEmbeddings.slice(0, 10).forEach(m => {
          console.warn(`      - ${m.id}`);
        });
      }
      
      // Check architecture fields for all models
      const modelsWithEmbeddingArch = models.filter(m => {
        const arch = m?.architecture || {};
        const outputMods = Array.isArray(arch?.output_modalities) ? arch.output_modalities : [];
        return outputMods.some(mod => String(mod).toLowerCase().includes('embed'));
      });
      
      if (modelsWithEmbeddingArch.length > 0) {
        console.warn(`   Found ${modelsWithEmbeddingArch.length} models with embedding in architecture:`);
        modelsWithEmbeddingArch.slice(0, 10).forEach(m => {
          const arch = m?.architecture || {};
          const outputMods = Array.isArray(arch?.output_modalities) ? arch.output_modalities : [];
          console.warn(`      - ${m.id} (output_modalities: ${outputMods.join(', ')})`);
        });
      } else {
        console.warn(`   No models found with embedding in architecture.output_modalities`);
      }
      
      // Log sample of all model IDs to help debug
      const allIds = models.slice(0, 100).map(m => m.id).join(', ');
      console.warn(`   First 100 model IDs from OpenRouter: ${allIds}`);
    }
    
    // Verify total count matches expected
    if (models.length < 500) {
      console.warn(`⚠️  Warning: Processed only ${models.length} models, expected ~617. Check OpenRouter API response.`);
    } else {
      console.log(`✅ Total models processed: ${models.length} (expected ~617)`);
    }
    
    // Log some example embedding models for verification
    if (embeddingCount > 0) {
      const exampleEmbeddings = embeddingModels.slice(0, 22).map(m => m.id);
      console.log(`📋 Found ${embeddingCount} embedding models (first 22): ${exampleEmbeddings.join(', ')}`);
      
      // Also show architecture info for first few
      if (embeddingCount > 0) {
        console.log(`📊 Architecture info for first 3 embedding models:`);
        embeddingModels.slice(0, 3).forEach(m => {
          console.log(`   - ${m.id}:`, {
            output_modalities: m.architecture?.output_modalities,
            modality: m.architecture?.modality,
            isEmbedding: m.isEmbedding
          });
        });
      }
    } else {
      console.warn('⚠️ No embedding models detected in OpenRouter response.');
      // Debug: Show some model IDs to help identify the issue
      const sampleModelIds = models.slice(0, 30).map(m => m.id);
      console.log(`🔍 Sample model IDs from response (first 30): ${sampleModelIds.join(', ')}`);
      
      // Check if any models have embedding-related fields in architecture
      const modelsWithEmbeddingFields = models.filter(m => {
        const arch = m.architecture || {};
        const outputMods = arch.output_modalities || [];
        const inputMods = arch.input_modalities || [];
        const modality = arch.modality || '';
        return Array.isArray(outputMods) && outputMods.some(m => String(m).toLowerCase().includes('embedding')) ||
               Array.isArray(inputMods) && inputMods.some(m => String(m).toLowerCase().includes('embedding')) ||
               String(modality).toLowerCase().includes('embedding') ||
               m.modalities?.toLowerCase().includes('embedding');
      }).slice(0, 10);
      
      if (modelsWithEmbeddingFields.length > 0) {
        console.log(`🔍 Found ${modelsWithEmbeddingFields.length} models with embedding-related architecture fields:`);
        modelsWithEmbeddingFields.forEach(m => {
          console.log(`   - ${m.id}:`, {
            output_modalities: m.architecture?.output_modalities,
            input_modalities: m.architecture?.input_modalities,
            modality: m.architecture?.modality,
            modalities: m.modalities
          });
        });
      }
      
      // Also check for specific known embedding model IDs
      const knownEmbeddingIds = [
        'thenlper/gte-base', 'thenlper/gte-large', 'intfloat/e5-large-v2',
        'openai/text-embedding-3-small', 'openai/text-embedding-3-large',
        'cohere/embed-english-v3.0', 'voyageai/voyage-large-2'
      ];
      const foundKnownEmbeddings = models.filter(m => 
        knownEmbeddingIds.some(knownId => m.id === knownId || m.id?.includes(knownId.split('/')[1]))
      );
      if (foundKnownEmbeddings.length > 0) {
        console.log(`✅ Found ${foundKnownEmbeddings.length} known embedding models by ID:`, 
          foundKnownEmbeddings.map(m => m.id).join(', ')
        );
      } else {
        console.log(`⚠️  None of the known embedding model IDs were found in the response`);
      }
    }
    
    return models;
  } catch (e) {
    console.warn('Failed to fetch models from OpenRouter:', e?.response?.status, e?.response?.data?.error || e?.message);
    return [];
  }
}

// Function to refresh models cache (called on demand or weekly)
async function refreshModelsCache() {
  const now = Date.now();
  const previousCount = modelsCache.data ? modelsCache.data.length : 0;
  
  console.log('🔄 Refreshing models list from OpenRouter...');
  const models = await fetchModelsFromOpenRouter();
  
  if (models.length > 0) {
    modelsCache.data = models;
    modelsCache.ts = now;
    
    const newCount = models.length;
    const embeddingCount = models.filter(m => {
      const id = String(m.id || '').toLowerCase();
      return id.includes('embedding') || 
             id.includes('embed-') || 
             id.includes('text-embedding') ||
             id.includes('voyage') ||
             id.includes('nomic-embed') ||
             id.includes('jina-embeddings') ||
             id.includes('bge-') ||
             id.includes('multilingual-e5') ||
             id.includes('all-minilm') ||
             id.includes('all-mpnet');
    }).length;
    
    // Check for specific embedding models
    const specificEmbeddings = [
      'openai/text-embedding-3-small',
      'openai/text-embedding-3-large',
      'openai/text-embedding-ada-002'
    ];
    const foundEmbeddings = specificEmbeddings.filter(id => 
      models.some(m => m.id === id || m.id?.includes(id))
    );
    const missingEmbeddings = specificEmbeddings.filter(id => 
      !models.some(m => m.id === id || m.id?.includes(id))
    );
    
    console.log(`✅ Models cache updated: ${newCount} models (was ${previousCount})`);
    if (newCount >= 600) {
      console.log(`🎉 Successfully cached ${newCount} models (target: ~617)`);
    }
    if (embeddingCount > 0) {
      console.log(`📊 Including ${embeddingCount} text-embedding models (expected: ~22)`);
    } else {
      console.log(`ℹ️  No embedding models detected in OpenRouter response (will use fallback list)`);
    }
    if (foundEmbeddings.length > 0) {
      console.log(`✅ Found specific embeddings: ${foundEmbeddings.join(', ')}`);
    }
    if (missingEmbeddings.length > 0) {
      // Only log this once per day to reduce log noise
      // This is expected behavior - OpenRouter may not have all embedding models
      // The system will use fallback list automatically
      const lastWarningKey = 'last_embedding_warning';
      const lastWarningTime = global[lastWarningKey] || 0;
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (Date.now() - lastWarningTime > oneDayMs) {
        global[lastWarningKey] = Date.now();
        console.log(`ℹ️  Note: Some expected embedding models not found in OpenRouter: ${missingEmbeddings.join(', ')}`);
        console.log(`ℹ️  These will be automatically added to /api/v1/models endpoint from fallback list`);
        // Log all embedding models that are available
        const availableEmbeddings = models
          .filter(m => m.id?.includes('embedding') || m.id?.includes('embed-') || m.id?.includes('text-embedding'))
          .map(m => m.id)
          .slice(0, 10); // Show first 10
        if (availableEmbeddings.length > 0) {
          console.log(`📋 Available embedding models from OpenRouter (first 10): ${availableEmbeddings.join(', ')}`);
        } else {
          console.log(`ℹ️  No embedding models found in OpenRouter response - will use fallback list in /api/v1/models`);
        }
      }
    }
    
    if (newCount > previousCount) {
      console.log(`🆕 New models detected! Added ${newCount - previousCount} new models`);
    }
  } else {
    console.warn('⚠️ No models fetched, keeping existing cache');
  }
}

// Public models list (proxied from OpenRouter) - cached for 10 minutes
// Models are automatically refreshed weekly in the background
app.get('/api/models', async (req, res) => {
  try {
    const now = Date.now();
    const cacheAge = now - modelsCache.ts;
    const forceRefresh = req.query.refresh === 'true' || req.query.direct === 'true';
    const isCacheValid = !forceRefresh && modelsCache.data && Array.isArray(modelsCache.data) && modelsCache.data.length > 0 && cacheAge < MODELS_CACHE_MS;
    
    // Use cache if available and not expired (10 minutes) and not forcing refresh
    if (isCacheValid) {
      const modelCount = modelsCache.data.length;
      const embeddingCount = modelsCache.data.filter(m => m.isEmbedding).length;
      console.log(`📋 Returning ${modelCount} models from cache (age: ${Math.round(cacheAge / 1000)}s)`);
      console.log(`   📊 Embedding models in cache: ${embeddingCount}`);
      if (modelCount >= 600) {
        console.log(`✅ Cache contains ${modelCount} models (target: ~617)`);
      }
      return res.json({ models: modelsCache.data });
    }
    
    // Cache expired or empty, refresh it using the shared function
    console.log(`🔄 Cache ${!modelsCache.data ? 'empty' : 'expired'} (age: ${Math.round(cacheAge / 1000)}s), refreshing...`);
    
    // If cache has very few models, force a fresh fetch
    const currentCount = modelsCache.data ? modelsCache.data.length : 0;
    if (currentCount > 0 && currentCount < 500) {
      console.log(`⚠️  Cache has only ${currentCount} models (expected ~617), forcing fresh fetch...`);
    }
    
    await refreshModelsCache();
    
    const models = modelsCache.data || [];
    const embeddingCount = models.filter(m => m.isEmbedding).length;
    console.log(`✅ Returning ${models.length} models after refresh`);
    console.log(`   📊 Embedding models detected: ${embeddingCount}`);
    
    if (models.length === 0) {
      console.warn('⚠️ Warning: No models available after refresh. Check OPENROUTER_TOKEN and OpenRouter API connectivity.');
    } else if (models.length >= 600) {
      console.log(`🎉 Successfully returning ${models.length} models (target: ~617)`);
      if (embeddingCount === 0) {
        console.log(`ℹ️  No embedding models detected in OpenRouter response (will use fallback list)`);
      }
    } else if (models.length < 500) {
      if (embeddingCount === 0) {
        console.log(`ℹ️  No embedding models detected in OpenRouter response (will use fallback list)`);
      }
    }
    
    // Log sample of embedding models if any found
    if (embeddingCount > 0) {
      const sampleEmbeddings = models.filter(m => m.isEmbedding).slice(0, 5).map(m => m.id);
      console.log(`   📋 Sample embedding models: ${sampleEmbeddings.join(', ')}`);
    }
    
    // If no embedding models found, add fallback embedding models
    if (embeddingCount === 0 && models.length > 0) {
      console.log(`ℹ️  No embedding models detected, adding fallback embedding models...`);
      
      const fallbackEmbeddings = [
        { id: 'openai/text-embedding-3-small', name: 'OpenAI Text Embedding 3 Small', pricing: { prompt_usd_per_m: 0.02, completion_usd_per_m: 0 }, context_length: 8191 },
        { id: 'openai/text-embedding-3-large', name: 'OpenAI Text Embedding 3 Large', pricing: { prompt_usd_per_m: 0.13, completion_usd_per_m: 0 }, context_length: 8191 },
        { id: 'openai/text-embedding-ada-002', name: 'OpenAI Text Embedding Ada 002', pricing: { prompt_usd_per_m: 0.0001, completion_usd_per_m: 0 }, context_length: 8191 },
        { id: 'cohere/embed-english-v3.0', name: 'Cohere Embed English v3.0', pricing: { prompt_usd_per_m: 0.1, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'cohere/embed-multilingual-v3.0', name: 'Cohere Embed Multilingual v3.0', pricing: { prompt_usd_per_m: 0.1, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'voyageai/voyage-large-2', name: 'Voyage Large 2', pricing: { prompt_usd_per_m: 0.1, completion_usd_per_m: 0 }, context_length: 16000 },
        { id: 'voyageai/voyage-code-2', name: 'Voyage Code 2', pricing: { prompt_usd_per_m: 0.1, completion_usd_per_m: 0 }, context_length: 16000 },
        { id: 'nomic-ai/nomic-embed-text-v1.5', name: 'Nomic Embed Text v1.5', pricing: { prompt_usd_per_m: 0.05, completion_usd_per_m: 0 }, context_length: 8192 },
        { id: 'jinaai/jina-embeddings-v2-base-en', name: 'Jina Embeddings v2 Base EN', pricing: { prompt_usd_per_m: 0.05, completion_usd_per_m: 0 }, context_length: 8192 },
        { id: 'jinaai/jina-embeddings-v2-base-zh', name: 'Jina Embeddings v2 Base ZH', pricing: { prompt_usd_per_m: 0.05, completion_usd_per_m: 0 }, context_length: 8192 },
        { id: 'togethercomputer/m2-bert-80M-8k-retrieval', name: 'M2-BERT 80M 8K', pricing: { prompt_usd_per_m: 0.01, completion_usd_per_m: 0 }, context_length: 8192 },
        { id: 'togethercomputer/m2-bert-80M-32k-retrieval', name: 'M2-BERT 80M 32K', pricing: { prompt_usd_per_m: 0.01, completion_usd_per_m: 0 }, context_length: 32768 },
        { id: 'intfloat/multilingual-e5-large', name: 'Multilingual E5 Large', pricing: { prompt_usd_per_m: 0.05, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'intfloat/multilingual-e5-base', name: 'Multilingual E5 Base', pricing: { prompt_usd_per_m: 0.03, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'BAAI/bge-large-en-v1.5', name: 'BGE Large EN v1.5', pricing: { prompt_usd_per_m: 0.05, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'BAAI/bge-base-en-v1.5', name: 'BGE Base EN v1.5', pricing: { prompt_usd_per_m: 0.03, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'BAAI/bge-small-en-v1.5', name: 'BGE Small EN v1.5', pricing: { prompt_usd_per_m: 0.01, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'sentence-transformers/all-MiniLM-L6-v2', name: 'All-MiniLM-L6-v2', pricing: { prompt_usd_per_m: 0.01, completion_usd_per_m: 0 }, context_length: 256 },
        { id: 'sentence-transformers/all-mpnet-base-v2', name: 'All-MPNet-Base-v2', pricing: { prompt_usd_per_m: 0.02, completion_usd_per_m: 0 }, context_length: 384 },
        { id: 'thenlper/gte-base', name: 'GTE Base', pricing: { prompt_usd_per_m: 0.03, completion_usd_per_m: 0 }, context_length: 512 },
        { id: 'thenlper/gte-large', name: 'GTE Large', pricing: { prompt_usd_per_m: 0.05, completion_usd_per_m: 0 }, context_length: 512 }
      ];
      
      // Format fallback embeddings to match OpenRouter model structure
      const formattedFallbacks = fallbackEmbeddings.map(embed => {
        const pIn = embed.pricing.prompt_usd_per_m;
        const pOut = embed.pricing.completion_usd_per_m;
        const fmt = (n) => (n === null ? '—' : `$${Number(n).toFixed(3)}/M`);
        
        return {
          id: embed.id,
          name: embed.name,
          description: `Text embedding model: ${embed.name}`,
          pricing: {
            prompt_usd_per_m: pIn,
            completion_usd_per_m: pOut,
            prompt_display: fmt(pIn),
            completion_display: fmt(pOut),
          },
          context_length: embed.context_length,
          by: embed.id.split('/')[0],
          modalities: 'text',
          architecture: {
            modality: 'text',
            input_modalities: ['text'],
            output_modalities: ['embeddings']
          },
          isEmbedding: true,
          url: `https://openrouter.ai/models/${encodeURIComponent(embed.id)}`
        };
      });
      
      // Only add fallback embeddings that don't already exist in models
      const existingIds = new Set(models.map(m => m.id));
      const newEmbeddings = formattedFallbacks.filter(embed => !existingIds.has(embed.id));
      
      if (newEmbeddings.length > 0) {
        models.push(...newEmbeddings);
        console.log(`✅ Added ${newEmbeddings.length} fallback embedding models: ${newEmbeddings.map(e => e.id).join(', ')}`);
        
        // Update cache with the new models
        modelsCache.data = models;
        modelsCache.ts = Date.now();
      }
    }
    
    res.json({ models });
  } catch (e) {
    console.error('❌ Error in /api/models endpoint:', e?.message || e);
    const fallbackModels = modelsCache.data || [];
    console.log(`📋 Returning ${fallbackModels.length} models from fallback cache`);
    res.json({ models: fallbackModels });
  }
});

// Force refresh models cache endpoint (for debugging/manual refresh)
app.post('/api/models/refresh', async (_req, res) => {
  try {
    console.log('🔄 Manual models cache refresh requested...');
    const previousCount = modelsCache.data ? modelsCache.data.length : 0;
    await refreshModelsCache();
    const newCount = modelsCache.data ? modelsCache.data.length : 0;
    
    res.json({
      success: true,
      previous_count: previousCount,
      new_count: newCount,
      cache_timestamp: new Date(modelsCache.ts).toISOString(),
      message: `Cache refreshed: ${previousCount} → ${newCount} models`
    });
  } catch (e) {
    console.error('❌ Error in /api/models/refresh:', e?.message || e);
    res.status(500).json({
      success: false,
      error: e?.message || 'Failed to refresh models cache'
    });
  }
});

// Debug endpoint to check cache status
app.get('/api/models/debug/cache', async (_req, res) => {
  try {
    const allModels = modelsCache.data || [];
    const embeddingModels = allModels.filter(m => m.isEmbedding || 
      String(m.id || '').toLowerCase().includes('embedding') ||
      String(m.id || '').toLowerCase().includes('embed-')
    );
    
    const cacheAge = Date.now() - modelsCache.ts;
    const cacheAgeMinutes = Math.round(cacheAge / (60 * 1000));
    
    res.json({
      cache_status: {
        total_models: allModels.length,
        embedding_models: embeddingModels.length,
        cache_timestamp: new Date(modelsCache.ts).toISOString(),
        cache_age_minutes: cacheAgeMinutes,
        cache_age_human: `${cacheAgeMinutes} minutes ago`,
        expected_total: 617,
        expected_embeddings: 22,
        is_complete: allModels.length >= 600
      },
      sample_models: allModels.slice(0, 10).map(m => ({
        id: m.id,
        name: m.name,
        isEmbedding: m.isEmbedding
      })),
      sample_embeddings: embeddingModels.slice(0, 10).map(m => ({
        id: m.id,
        name: m.name
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed to get cache status' });
  }
});

// Debug endpoint to check embedding models
app.get('/api/models/debug/embeddings', async (_req, res) => {
  try {
    const allModels = modelsCache.data || [];
    const embeddingModels = allModels.filter(m => 
      m.isEmbedding ||
      m.id?.includes('embedding') || 
      m.id?.includes('embed-') || 
      m.id?.includes('text-embedding')
    );
    
    const specificEmbeddings = [
      'openai/text-embedding-3-small',
      'openai/text-embedding-3-large',
      'openai/text-embedding-ada-002'
    ];
    
    const found = specificEmbeddings.filter(id => 
      allModels.some(m => m.id === id)
    );
    const missing = specificEmbeddings.filter(id => 
      !allModels.some(m => m.id === id)
    );
    
    res.json({
      total_models: allModels.length,
      embedding_models_count: embeddingModels.length,
      embedding_models: embeddingModels.map(m => ({
        id: m.id,
        name: m.name,
        by: m.by
      })),
      specific_embeddings: {
        found: found,
        missing: missing
      },
      cache_timestamp: modelsCache.ts ? new Date(modelsCache.ts).toISOString() : null,
      cache_age_minutes: modelsCache.ts ? Math.round((Date.now() - modelsCache.ts) / 60000) : null
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Internal server error' });
  }
});

// Direct proxy to OpenRouter API - fetches models directly without cache
app.get('/api/models/direct', async (_req, res) => {
  try {
    if (!OPENROUTER_TOKEN) {
      return res.status(500).json({
        error: 'OPENROUTER_TOKEN not configured',
        message: 'Please set OPENROUTER_TOKEN in environment variables'
      });
    }
    
    console.log('📡 Fetching models directly from OpenRouter API (no cache)...');
    console.log(`   Token present: ${!!OPENROUTER_TOKEN} (${OPENROUTER_TOKEN.substring(0, 12)}...)`);
    
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${OPENROUTER_TOKEN}`,
        'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
        'X-Title': 'UBU AI SERVICE',
        'Accept': 'application/json'
      },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Parse response - OpenRouter returns {"data": [...]}
    // axios wraps it: response.data = {"data": [...]}
    // So models = response.data.data
    const responseBody = response?.data;
    let models = [];
    
    if (responseBody && typeof responseBody === 'object') {
      if (Array.isArray(responseBody.data)) {
        models = responseBody.data;
        console.log(`✅ Parsed ${models.length} models from response.data.data`);
      } else if (Array.isArray(responseBody)) {
        models = responseBody;
        console.log(`✅ Parsed ${models.length} models from response.data (direct array)`);
      } else {
        console.warn(`⚠️  Unexpected response structure. Keys:`, Object.keys(responseBody || {}));
        console.warn(`   Response sample:`, JSON.stringify(responseBody).substring(0, 500));
      }
    }
    
    console.log(`✅ Direct fetch from OpenRouter: ${models.length} models received`);
    console.log(`   Response status: ${response?.status}`);
    console.log(`   Response structure:`, {
      has_response: !!response,
      has_data: !!responseBody,
      data_type: typeof responseBody,
      is_data_array: Array.isArray(responseBody),
      data_keys: responseBody && typeof responseBody === 'object' ? Object.keys(responseBody) : 'N/A',
      models_count: models.length
    });
    
    // Log sample of model IDs
    if (models.length > 0) {
      const sampleIds = models.slice(0, 10).map(m => m?.id).filter(Boolean);
      console.log(`   Sample model IDs: ${sampleIds.join(', ')}`);
      
      // Count embedding models
      const embeddingCount = models.filter(m => {
        const id = String(m?.id || '').toLowerCase();
        const arch = m?.architecture || {};
        const outputMods = Array.isArray(arch?.output_modalities) ? arch.output_modalities : [];
        return id.includes('embedding') || 
               id.includes('embed-') || 
               id.includes('text-embedding') ||
               outputMods.some(mod => String(mod).toLowerCase().includes('embedding'));
      }).length;
      console.log(`   Embedding models found: ${embeddingCount}`);
      
      if (embeddingCount > 0) {
        const embeddingIds = models.filter(m => {
          const id = String(m?.id || '').toLowerCase();
          return id.includes('embedding') || id.includes('embed-');
        }).slice(0, 5).map(m => m.id);
        console.log(`   Sample embedding IDs: ${embeddingIds.join(', ')}`);
      }
    } else {
      console.warn(`⚠️  No models found in direct fetch!`);
      console.warn(`   Full response:`, JSON.stringify(responseBody, null, 2).substring(0, 1000));
    }
    
    // Return the raw OpenRouter response format
    res.json({
      source: 'openrouter_direct',
      timestamp: new Date().toISOString(),
      count: models.length,
      data: models,
      response_structure: {
        has_data: !!responseBody,
        data_type: typeof responseBody,
        data_keys: responseBody && typeof responseBody === 'object' ? Object.keys(responseBody) : []
      }
    });
  } catch (error) {
    console.error('❌ Error fetching models directly from OpenRouter:', error?.message);
    console.error('   Status:', error?.response?.status);
    console.error('   Status text:', error?.response?.statusText);
    console.error('   Response data:', error?.response?.data);
    console.error('   Has token:', !!OPENROUTER_TOKEN);
    
    res.status(error?.response?.status || 500).json({
      error: 'Failed to fetch models from OpenRouter',
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      details: error?.response?.data,
      has_token: !!OPENROUTER_TOKEN
    });
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
          'X-Title': 'UBU AI SERVICE'
        },
        timeout: 7000
      });
      orLatency = Date.now() - t0;
      orStatus = 'operational';
    } catch (e) {
      // Silently handle 401 errors (invalid/expired token is expected in some setups)
      // Only log non-401 errors for debugging
      if (e.response && e.response.status !== 401) {
        console.warn('OpenRouter health check error:', e.response.status, e.response.data?.message || e.response.data || '');
      }
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
  
  try {
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
    } finally {
      client.release();
    }
  } catch (dbError) {
    // Log the actual database error for debugging
    console.error('❌ Database error in /api/admin/usage:', dbError?.message || dbError);
    // Always throw error - no fallback mode (use real database)
    res.status(500).json({ 
      error: 'failed_to_query_usage',
      message: dbError?.message || 'Database connection failed'
    });
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
  const client = await pool.connect();
  try {
    const cookies = parseCookies(req);
    const session = verify(cookies.session);
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
    const { keyId, model, prompt } = req.body || {};
    if (!keyId || !model || !prompt) return res.status(400).json({ error: 'missing_params' });
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
      // Don't auto-disable, just reject the request
      // Admin can manually disable if needed
      return res.status(403).json({ 
        error: 'credit_exhausted', 
        message: 'Credit limit has been reached. Please contact administrator to increase your credit limit.',
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
      
      // Validate provider key format
      if (useKey && useKey.length < 20) {
        console.warn(`   ⚠️ Provider key seems invalid (too short), falling back to global token`);
        if (OPENROUTER_TOKEN) {
          useKey = OPENROUTER_TOKEN;
        }
      }
      
      if (!useKey) return res.status(401).json({ error: 'provider_key_missing' });
      
      console.log(`   🔑 [test-model] Using provider key: ${useKey.substring(0, 12) + '...'} (full length: ${useKey.length})`);
      console.log(`   🔍 [test-model] Key matches OPENROUTER_TOKEN: ${useKey === OPENROUTER_TOKEN}`);
      console.log(`   🔍 [test-model] Key starts with 'sk-or-v1': ${useKey.startsWith('sk-or-v1')}`);
      
      const resp = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [{ role: 'user', content: String(prompt) }]
      }, {
        headers: {
          Authorization: `Bearer ${useKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
          'X-Title': 'UBU AI SERVICE'
        },
        timeout: 20000
      });
      data = resp.data;
    } catch (e) {
      const status = e?.response?.status || 500;
      const errorData = e?.response?.data || {};
      const errorMessage = errorData?.error?.message || errorData?.message || e?.message || 'Unknown error';
      
      // Log detailed error for debugging
      console.error(`   ❌ [test-model] OpenRouter API error (${status}):`, {
        message: errorMessage,
        code: errorData?.error?.code || errorData?.code,
        details: errorData
      });
      
      // If 401 and we have a dedicated provider key, try falling back to global token
      if (status === 401 && (errorMessage.includes('User not found') || errorMessage.includes('Invalid'))) {
        const providerKey = (String(key.key_value || '').startsWith('ubu_'))
          ? (key.provider_key_value)
          : key.key_value;
        
        console.log(`   🔍 [test-model] Debug info: keyId=${key.id}, providerKey=${providerKey ? providerKey.substring(0, 12) + '...' : 'null'}, hasGlobalToken=${!!OPENROUTER_TOKEN}, providerKeyMatchesGlobal=${providerKey === OPENROUTER_TOKEN}`);
        
        // Try fallback if:
        // 1. We have a global OPENROUTER_TOKEN
        // 2. Either providerKey is null/empty OR providerKey is different from global token
        const shouldTryFallback = OPENROUTER_TOKEN && (!providerKey || providerKey !== OPENROUTER_TOKEN);
        
        if (shouldTryFallback) {
          console.warn(`   ⚠️ [test-model] Provider key failed (${providerKey ? 'dedicated key' : 'missing key'}), attempting fallback to global OPENROUTER_TOKEN`);
          try {
            console.log(`   🔄 [test-model] Trying fallback with global token: ${OPENROUTER_TOKEN.substring(0, 12) + '...'}`);
            
            const fallbackResp = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
              model,
              messages: [{ role: 'user', content: String(prompt) }]
            }, {
              headers: {
                Authorization: `Bearer ${OPENROUTER_TOKEN}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
                'X-Title': 'UBU AI SERVICE'
              },
              timeout: 20000
            });
            
            console.log(`   ✅ [test-model] Fallback to global token succeeded`);
            
            // Update provider_key_value to null so it uses global token next time
            await client.query('UPDATE api_keys SET provider_key_value = NULL WHERE id = $1', [key.id]);
            console.log(`   🔄 [test-model] Cleared invalid provider key from database`);
            
            data = fallbackResp.data;
          } catch (fallbackError) {
            const fallbackStatus = fallbackError?.response?.status || 500;
            const fallbackErrorData = fallbackError?.response?.data || {};
            console.error(`   ❌ [test-model] Fallback also failed (${fallbackStatus}):`, {
              message: fallbackErrorData?.error?.message || fallbackErrorData?.message || fallbackError?.message,
              details: fallbackErrorData
            });
            
            // If fallback also fails with 401, it means global token is also invalid
            if (fallbackStatus === 401) {
              console.log(`   📤 [test-model] Returning 401 error response (fallback failed with 401)`);
              return res.status(401).json({ 
                error: 'invalid_api_key', 
                message: 'Both the dedicated API key and global token are invalid or expired. Please contact administrator.',
                details: errorData
              });
            }
            
            console.log(`   📤 [test-model] Returning ${fallbackStatus || 401} error response (fallback failed)`);
            return res.status(fallbackStatus || 401).json({ 
              error: 'invalid_api_key', 
              message: 'The API key is invalid or expired. Please check your API key or contact administrator.',
              details: errorData
            });
          }
        } else {
          console.log(`   ℹ️ [test-model] Fallback not attempted: hasGlobalToken=${!!OPENROUTER_TOKEN}, providerKeyMatchesGlobal=${providerKey === OPENROUTER_TOKEN}`);
          console.log(`   📤 [test-model] Returning 401 error response (fallback not attempted)`);
          return res.status(401).json({ 
            error: 'invalid_api_key', 
            message: 'The API key is invalid or expired. Please check your API key or contact administrator.',
            details: errorData
          });
        }
      } else {
        // return error from provider
        console.log(`   📤 [test-model] Returning ${status} error response (provider error)`);
        return res.status(status).json({ 
          error: 'provider_error', 
          message: errorMessage,
          details: errorData 
        });
      }
    }

    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage || {};
    const tokensIn = Number(usage?.prompt_tokens || usage?.input_tokens || 0);
    const tokensOut = Number(usage?.completion_tokens || usage?.output_tokens || 0);
    const tokensTotal = Number(usage?.total_tokens || tokensIn + tokensOut);
    
    // Debug: Log OpenRouter response to see what cost fields are available
    console.log(`🔍 [test-model] OpenRouter response:`, {
      model: data?.model || model,
      usage_keys: Object.keys(usage || {}),
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_cost: usage?.total_cost,
      cost: usage?.cost,
      full_usage: usage
    });
    
    // Calculate cost: try multiple possible fields from OpenRouter response
    // OpenRouter may send cost in different fields: total_cost, cost, or in nested structure
    let cost = Number(usage?.total_cost || usage?.cost || data?.total_cost || data?.cost || 0);
    
    // If cost is still 0 or invalid, calculate from pricing
    if (!Number.isFinite(cost) || cost === 0) {
      const modelId = data?.model || model || 'unknown';
      console.log(`💰 [test-model] Cost not in response (${cost}), calculating from OpenRouter pricing for model: ${modelId}`);
      // Try to get pricing from OpenRouter (with retry if cache is stale)
      let pricing = await getModelPricingPerM(modelId);
      // If not found and cache might be stale, try refreshing
      if (!pricing && modelsCache.ts && (Date.now() - modelsCache.ts) < MODELS_CACHE_MS) {
        console.log(`🔄 Retrying with cache refresh for model: ${modelId}`);
        pricing = await getModelPricingPerM(modelId, true);
      }
      if (pricing && Number.isFinite(pricing.inM) && Number.isFinite(pricing.outM)) {
        cost = (tokensIn / 1_000_000) * pricing.inM + (tokensOut / 1_000_000) * pricing.outM;
        console.log(`💰 [test-model] Calculated cost from pricing: $${cost.toFixed(6)} (${tokensIn} in, ${tokensOut} out, inM: ${pricing.inM}, outM: ${pricing.outM})`);
      } else {
        // Fallback to comprehensive static table if pricing not found
        const mname = String(modelId).toLowerCase();
        const table = [
          // OpenAI models
          { match: 'gpt-4o', inM: 5, outM: 15 },
          { match: 'gpt-4o-mini', inM: 0.5, outM: 1.5 },
          { match: 'gpt-4-turbo', inM: 10, outM: 30 },
          { match: 'gpt-4', inM: 30, outM: 60 },
          { match: 'gpt-3.5-turbo', inM: 0.5, outM: 1.5 },
          { match: 'gpt-5', inM: 2.5, outM: 10 },
          { match: 'gpt-5.2', inM: 2.5, outM: 10 },
          { match: 'gpt-5-mini', inM: 0.15, outM: 0.6 },
          { match: 'gpt-5-nano', inM: 0.1, outM: 0.4 },
          // Google models
          { match: 'gemini-2.5-pro', inM: 0.125, outM: 0.5 },
          { match: 'gemini-2.5-flash', inM: 0.075, outM: 0.3 },
          { match: 'gemini-3-flash', inM: 0.075, outM: 0.3 },
          // Anthropic models
          { match: 'claude-3.5-sonnet', inM: 3, outM: 15 },
          { match: 'claude-3.7-sonnet', inM: 3, outM: 15 },
          { match: 'claude-3-haiku', inM: 0.25, outM: 1.25 },
          { match: 'claude-sonnet-4.5', inM: 3, outM: 15 },
          // Embedding models (input only, no output)
          { match: 'text-embedding-3-large', inM: 0.13, outM: 0 },
          { match: 'text-embedding-3-small', inM: 0.02, outM: 0 },
          { match: 'text-embedding-ada-002', inM: 0.1, outM: 0 },
          // Free models (set to minimal cost to track usage)
          { match: ':free', inM: 0, outM: 0 },
          // DALL-E (image generation - estimate based on size)
          { match: 'dall-e-3', inM: 0.04, outM: 0 }, // $0.04 per image
        ];
        let inM = 0, outM = 0;
        for (const t of table) {
          if (mname.includes(t.match)) {
            inM = t.inM;
            outM = t.outM;
            break;
          }
        }
        if (inM || outM) {
          // For embedding models, cost is per input token only
          // For image models, estimate cost (DALL-E is per image, not per token)
          if (mname.includes('dall-e')) {
            // DALL-E: estimate $0.04 per image (1 image = ~1000 tokens equivalent)
            cost = tokensIn > 0 ? 0.04 : 0;
            console.log(`💰 [test-model] Calculated cost for image model (DALL-E): $${cost.toFixed(6)}`);
          } else {
            cost = (tokensIn / 1_000_000) * inM + (tokensOut / 1_000_000) * outM;
            console.log(`💰 [test-model] Calculated cost from fallback table: $${cost.toFixed(6)} (${tokensIn} in, ${tokensOut} out, inM: ${inM}, outM: ${outM})`);
          }
        } else {
          // If no pricing found, try to estimate from a default rate (conservative estimate)
          // Use a default rate of $1 per 1M tokens as fallback
          const defaultRate = 1.0;
          cost = ((tokensIn + tokensOut) / 1_000_000) * defaultRate;
          console.warn(`⚠️ [test-model] No pricing found for model: ${modelId}, using default rate $${defaultRate}/M tokens: $${cost.toFixed(6)}`);
        }
      }
    } else {
      console.log(`✅ [test-model] Using cost from OpenRouter response: $${cost.toFixed(6)}`);
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
  } catch (unexpectedError) {
    // Catch any unexpected errors (e.g., database connection errors, JSON parsing errors, etc.)
    console.error('❌ [test-model] Unexpected error:', unexpectedError);
    // Ensure we always return valid JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'internal_server_error', 
        message: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? unexpectedError.message : undefined
      });
    }
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
    const host = req.get('host') || req.get('x-forwarded-host') || req.get('x-forwarded-host') || 'localhost:3000';
    
    // Debug logging
    console.log(`🔍 OAuth login - Host detection:`, {
      'req.host': req.get('host'),
      'x-forwarded-host': req.get('x-forwarded-host'),
      'protocol': protocol,
      'final-host': host
    });
    
    // Check if production (aigateway.ubu.ac.th)
    if (host && host.includes('aigateway.ubu.ac.th')) {
      // For aigateway.ubu.ac.th, use backend API callback (like dev2 pattern)
      redirectUri = `https://aigateway.ubu.ac.th/api/oauth/callback`;
    } else if (host && host.includes('dev2.ubu.ac.th')) {
      // Legacy support for dev2.ubu.ac.th
      redirectUri = `https://dev2.ubu.ac.th/ai_gateway_api/api/oauth/callback`;
    } else if (host && host !== 'localhost:3000') {
      // Use detected host
      redirectUri = `${protocol}://${host}/callback`;
    } else {
      // Fallback: use hardcoded aigateway.ubu.ac.th if host detection fails
      console.warn('⚠️ Host detection failed, using fallback: aigateway.ubu.ac.th');
      redirectUri = `https://aigateway.ubu.ac.th/api/oauth/callback`;
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
      // Build redirect URI for token exchange (must match the one used in login)
      const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
      const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:3000';
      let redirectUriForToken = process.env.REDIRECT_URI;
      if (!redirectUriForToken) {
        if (host && host.includes('aigateway.ubu.ac.th')) {
          redirectUriForToken = `https://aigateway.ubu.ac.th/api/oauth/callback`;
        } else if (host && host.includes('dev2.ubu.ac.th')) {
          redirectUriForToken = `https://dev2.ubu.ac.th/ai_gateway_api/api/oauth/callback`;
        } else if (host && host !== 'localhost:3000') {
          redirectUriForToken = `${protocol}://${host}/callback`;
        } else {
          // Fallback: use hardcoded aigateway.ubu.ac.th
          redirectUriForToken = `https://aigateway.ubu.ac.th/api/oauth/callback`;
        }
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
          redirect_uri: redirectUriForToken
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
    // For localhost, allow fallback if database connection fails
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    let user;
    try {
      user = await createOrUpdateUser(mappedUser);
      console.log('💾 User saved to database:', user);
    } catch (dbError) {
      // For localhost, allow fallback without database
      if (isLocalhost) {
        console.log('ℹ️ [Localhost Mode] Database not available, using fallback user object. This is normal for local development.');
        // Check if user should be admin (from environment variable or default admin usernames)
        const adminUsernames = (process.env.ADMIN_USERNAMES || '').split(',').map(u => u.trim()).filter(Boolean);
        const defaultAdminUsernames = ['admin', 'administrator', 'setthapong', 'setthapong.phalaphrom', 'ocsettph', 'ocsettph.phalaphrom'];
        const allAdminUsernames = [...adminUsernames, ...defaultAdminUsernames];
        const username = mappedUser.ubuaccount?.toLowerCase() || '';
        const isAdminUser = allAdminUsernames.some(adminUser => username.includes(adminUser.toLowerCase()));
        
        // Create user object from OAuth data without database
        user = {
          id: mappedUser.ubuaccount, // Use username as ID for localhost
          username: mappedUser.ubuaccount,
          personcode: mappedUser.personcode || '',
          fullname: `${mappedUser.prefix_name}${mappedUser.fname} ${mappedUser.lname}`.trim(),
          faculty: mappedUser.faculty || 'ไม่ระบุ',
          department: mappedUser.department_name || 'ไม่ระบุ',
          email: mappedUser.email || '',
          position: mappedUser.position || '',
          level_name: mappedUser.level_name || '',
          role: isAdminUser ? 'ADMIN' : 'USER', // Set role based on admin check
          status: 'active'
        };
        console.log('💾 Using fallback user object (no database):', user);
        if (isAdminUser) {
          console.log('✅ User is set as ADMIN in localhost fallback mode');
        }
      } else {
        // For production, re-throw the error
        throw dbError;
      }
    }

    const token = sign({ user, iat: Date.now() });
    // Protocol and host already detected above
    const isHttps = protocol === 'https';
    
    setCookie(res, 'session', token, { 
      httpOnly: true, 
      path: '/', 
      isHttps, 
      protocol,
      host 
    });
    console.log(`🍪 Session cookie set for host: ${host}, protocol: ${protocol}, https: ${isHttps}, localhost: ${host.includes('localhost') || host.includes('127.0.0.1')}`);
    
    // Set CORS headers for the response
    const origin = req.headers.origin || `https://${host}`;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    res.status(500).json({ success: false, message: 'OAuth authentication failed' });
  }
});

// Fallback: support GET /api/oauth/callback with query params (some environments may not POST)
app.get('/api/oauth/callback', async (req, res) => {
  console.log('🔄 GET /api/oauth/callback - Processing OAuth callback (GET)');
  console.log('📋 Query params:', JSON.stringify(req.query, null, 2));
  console.log('📋 Full URL:', req.url);
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
      // Build redirect URI for token exchange (must match the one used in login)
      const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
      const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:3000';
      let redirectUriForToken = process.env.REDIRECT_URI;
      if (!redirectUriForToken) {
        if (host && host.includes('aigateway.ubu.ac.th')) {
          redirectUriForToken = `https://aigateway.ubu.ac.th/api/oauth/callback`;
        } else if (host && host.includes('dev2.ubu.ac.th')) {
          redirectUriForToken = `https://dev2.ubu.ac.th/ai_gateway_api/api/oauth/callback`;
        } else if (host && host !== 'localhost:3000') {
          redirectUriForToken = `${protocol}://${host}/callback`;
        } else {
          // Fallback: use hardcoded aigateway.ubu.ac.th
          redirectUriForToken = `https://aigateway.ubu.ac.th/api/oauth/callback`;
        }
      }
      
      const tokenResponse = await fetch(`${process.env.OAUTH_TOKEN_URL || 'https://dev.ubu.ac.th/oauth_server/token'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.OAUTH_CLIENT_ID || 'ubu-ai-gateway',
          client_secret: process.env.OAUTH_CLIENT_SECRET || 'your-client-secret',
          code: code,
          redirect_uri: redirectUriForToken
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

    // Create or update user in database
    // For localhost, allow fallback if database connection fails
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    let user;
    try {
      user = await createOrUpdateUser(mappedUser);
      console.log('💾 User saved to database (GET):', user);
    } catch (dbError) {
      // For localhost, allow fallback without database
      if (isLocalhost) {
        console.warn('⚠️ Database connection failed in localhost, using fallback user object (GET):', dbError.message);
        // Check if user should be admin (from environment variable or default admin usernames)
        const adminUsernames = (process.env.ADMIN_USERNAMES || '').split(',').map(u => u.trim()).filter(Boolean);
        const defaultAdminUsernames = ['admin', 'administrator', 'setthapong', 'setthapong.phalaphrom', 'ocsettph', 'ocsettph.phalaphrom'];
        const allAdminUsernames = [...adminUsernames, ...defaultAdminUsernames];
        const username = mappedUser.ubuaccount?.toLowerCase() || '';
        const isAdminUser = allAdminUsernames.some(adminUser => username.includes(adminUser.toLowerCase()));
        
        // Create user object from OAuth data without database
        user = {
          id: mappedUser.ubuaccount, // Use username as ID for localhost
          username: mappedUser.ubuaccount,
          personcode: mappedUser.personcode || '',
          fullname: `${mappedUser.prefix_name}${mappedUser.fname} ${mappedUser.lname}`.trim(),
          faculty: mappedUser.faculty || 'ไม่ระบุ',
          department: mappedUser.department_name || 'ไม่ระบุ',
          email: mappedUser.email || '',
          position: mappedUser.position || '',
          level_name: mappedUser.level_name || '',
          role: isAdminUser ? 'ADMIN' : 'USER', // Set role based on admin check
          status: 'active'
        };
        console.log('💾 Using fallback user object (no database) (GET):', user);
        if (isAdminUser) {
          console.log('✅ User is set as ADMIN in localhost fallback mode (GET)');
        }
      } else {
        // For production, re-throw the error
        throw dbError;
      }
    }

    const token = sign({ user, iat: Date.now() });
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
    let frontendUrl;
    if (host && host.includes('aigateway.ubu.ac.th')) {
      frontendUrl = 'https://aigateway.ubu.ac.th/';
    } else if (host && host.includes('dev2.ubu.ac.th')) {
      frontendUrl = 'https://dev2.ubu.ac.th/ai_gateway/';
    } else {
      frontendUrl = 'http://localhost:3000/';
    }
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
    // For localhost, allow fallback if database connection fails
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    let user;
    try {
      user = await createOrUpdateUser(hrData);
      console.log('💾 User saved to database:', user);
    } catch (dbError) {
      // For localhost, allow fallback without database
      if (isLocalhost) {
        console.warn('⚠️ Database connection failed in localhost, using fallback user object (direct login):', dbError.message);
        // Check if user should be admin (from environment variable or default admin usernames)
        const adminUsernames = (process.env.ADMIN_USERNAMES || '').split(',').map(u => u.trim()).filter(Boolean);
        const defaultAdminUsernames = ['admin', 'administrator', 'setthapong', 'setthapong.phalaphrom', 'ocsettph', 'ocsettph.phalaphrom'];
        const allAdminUsernames = [...adminUsernames, ...defaultAdminUsernames];
        const username = hrData.ubuaccount?.toLowerCase() || '';
        const isAdminUser = allAdminUsernames.some(adminUser => username.includes(adminUser.toLowerCase()));
        
        // Create user object from HR data without database
        user = {
          id: hrData.ubuaccount, // Use username as ID for localhost
          username: hrData.ubuaccount,
          personcode: hrData.personcode || '',
          fullname: `${hrData.prefix_name}${hrData.fname} ${hrData.lname}`.trim(),
          faculty: hrData.faculty || 'ไม่ระบุ',
          department: hrData.department_name || 'ไม่ระบุ',
          email: hrData.email || '',
          position: hrData.position || '',
          level_name: hrData.level_name || '',
          role: isAdminUser ? 'ADMIN' : 'USER', // Set role based on admin check
          status: 'active'
        };
        console.log('💾 Using fallback user object (no database) (direct login):', user);
        if (isAdminUser) {
          console.log('✅ User is set as ADMIN in localhost fallback mode (direct login)');
        }
      } else {
        // For production, re-throw the error
        throw dbError;
      }
    }

    const token = sign({ user, iat: Date.now() });
    const isHttps = protocol === 'https';
    
    setCookie(res, 'session', token, { 
      httpOnly: true, 
      path: '/', 
      isHttps, 
      protocol,
      host 
    });
    console.log(`🍪 Session cookie set for host: ${host}, protocol: ${protocol}, https: ${isHttps}, localhost: ${host.includes('localhost') || host.includes('127.0.0.1')}`);
    
    // Set CORS headers for the response
    const origin = req.headers.origin || `https://${host}`;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
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

// GET /api/me/usage - Get current user's credit/usage info (requires login)
app.get('/api/me/usage', async (req, res) => {
  // allow reading session for cross-site requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Please login first' });
  }
  
  // For localhost, allow fallback if database connection fails
  const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
  const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  const userId = session.user.id;
  
  try {
    const client = await pool.connect();
  
    try {
    // Get user info
    const userResult = await client.query(
      'SELECT id, email, fullname FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get all API keys for this user
    const keysResult = await client.query(`
      SELECT id, name, credit_limit, is_active, created_at
      FROM api_keys
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    
    const keys = keysResult.rows;
    
    // Calculate total usage across all keys
    let totalUsed = 0;
    let totalLimit = 0;
    const keysWithUsage = [];
    
    for (const key of keys) {
      const keyId = key.id;
      const creditLimit = Number(key.credit_limit || 0);
      totalLimit += creditLimit;
      
      // Get usage for this key
      const usageQuery = await client.query(`
        SELECT COALESCE(SUM(cost_usd), 0) as total_used
        FROM api_usage_logs
        WHERE api_key_id = $1 OR key_id = $1
      `, [keyId]);
      
      const used = Number(usageQuery.rows[0]?.total_used || 0);
      totalUsed += used;
      
      keysWithUsage.push({
        id: key.id,
        name: key.name,
        credit_limit: creditLimit,
        used: used,
        remaining: creditLimit - used,
        is_active: key.is_active
      });
    }
    
      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname
        },
        summary: {
          total_limit: totalLimit,
          total_used: totalUsed,
          remaining: totalLimit - totalUsed,
          keys_count: keys.length
        },
        keys: keysWithUsage
      });
    } finally {
      client.release();
    }
  } catch (dbError) {
    // Log the actual database error for debugging
    console.error('❌ Database error in /api/me/usage:', dbError?.message || dbError);
    // Always throw error - no fallback mode (use real database)
    res.status(500).json({ error: 'failed_to_query_usage', message: dbError?.message || 'Database connection failed' });
  }
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

  // For localhost, allow fallback if database connection fails
  const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
  const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, ubuaccount, fullname, faculty, department_name, email, 
               position, role, status, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `);
      
      console.log(`📊 Found ${result.rows.length} users`);
      res.json({ users: result.rows });
    } finally {
      client.release();
    }
  } catch (dbError) {
    // Log the actual database error for debugging
    console.error('❌ Database error in /api/admin/users:', dbError?.message || dbError);
    // Always throw error - no fallback mode (use real database)
    res.status(500).json({ error: 'Failed to fetch users', message: dbError?.message || 'Database connection failed' });
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

  const { role, status, faculty, department_name, position, level_name, email } = req.body || {};
  try {
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE users 
      SET role = $2,
          status = $3,
          faculty = COALESCE($4, faculty),
          department_name = COALESCE($5, department_name),
          position = COALESCE($6, position),
          level_name = COALESCE($7, level_name),
          email = COALESCE($8, email),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [req.params.id, role, status, faculty, department_name, position, level_name, email]);
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

// Sync users with missing or "ไม่ระบุ" faculty/department from HR (admin only)
app.post('/api/admin/users/sync-hr-unspecified', async (req, res) => {
  console.log('🔄 POST /api/admin/users/sync-hr-unspecified - Sync users with missing/"ไม่ระบุ" faculty/department from HR');

  // Check admin role
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    console.log('❌ Unauthorized: Admin role required for HR sync');
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { limit } = req.body || {};
  const limitNum = Math.min(Math.max(Number(limit) || 200, 1), 2000);

  const client = await pool.connect();
  try {
    // เดิมเลือกเฉพาะคนที่ faculty/department เป็น "ไม่ระบุ"
    // ตอนนี้เปลี่ยนเป็น "เลือกทุก user" (ภายใต้ limit) เพื่อบังคับให้ข้อมูลในระบบตรงกับ HR เสมอ
    const usersResult = await client.query(
      `
      SELECT id, ubuaccount, fullname, faculty, department_name, email
      FROM users
      ORDER BY created_at ASC
      LIMIT $1
      `,
      [limitNum]
    );

    const candidates = usersResult.rows;
    console.log(`📊 [sync-hr-unspecified] Found ${candidates.length} candidate users (limit=${limitNum})`);

    let attempted = 0;
    let updatedCount = 0;
    let notFoundInHr = 0;
    let errorCount = 0;
    let stillUnspecified = 0;
    const details = [];

    for (const user of candidates) {
      const baseUsername =
        user.ubuaccount ||
        (user.email ? String(user.email).split('@')[0] : null);

      if (!baseUsername) {
        console.log(
          `⚠️ [sync-hr-unspecified] Skip user id=${user.id} (no ubuaccount/email)`
        );
        details.push({
          user_id: user.id,
          ubuaccount: user.ubuaccount || null,
          email: user.email || null,
          status: 'skipped_no_username'
        });
        continue;
      }

      attempted++;
      try {
        console.log(
          `🔍 [sync-hr-unspecified] Fetching HR data for user id=${user.id}, ubuaccount=${user.ubuaccount}, derivedUsername=${baseUsername}`
        );
        const hrData = await fetchHrData(baseUsername);

        if (!hrData) {
          console.log(
            `❌ [sync-hr-unspecified] HR data not found for username=${baseUsername} (user id=${user.id})`
          );
          notFoundInHr++;
          details.push({
            user_id: user.id,
            ubuaccount: user.ubuaccount || null,
            email: user.email || null,
            status: 'hr_not_found'
          });
          continue;
        }

        try {
          const updatedUser = await createOrUpdateUser(hrData);
          const faculty = updatedUser.faculty;
          const department = updatedUser.department_name;

          if (
            faculty &&
            faculty !== 'ไม่ระบุ' &&
            department &&
            department !== 'ไม่ระบุ'
          ) {
            updatedCount++;
            console.log(
              `✅ [sync-hr-unspecified] Updated user id=${updatedUser.id} with faculty="${faculty}", department="${department}"`
            );
            details.push({
              user_id: updatedUser.id,
              ubuaccount: updatedUser.ubuaccount || null,
              email: updatedUser.email || null,
              status: 'updated',
              faculty,
              department_name: department
            });
          } else {
            stillUnspecified++;
            console.log(
              `⚠️ [sync-hr-unspecified] User id=${updatedUser.id} still missing/ไม่ระบุ faculty or department after HR sync`,
              { faculty, department }
            );
            details.push({
              user_id: updatedUser.id,
              ubuaccount: updatedUser.ubuaccount || null,
              email: updatedUser.email || null,
              status: 'still_unspecified',
              faculty,
              department_name: department
            });
          }
        } catch (updateError) {
          errorCount++;
          console.error(
            `❌ [sync-hr-unspecified] Error updating user from HR data (user id=${user.id}):`,
            updateError?.message || updateError
          );
          details.push({
            user_id: user.id,
            ubuaccount: user.ubuaccount || null,
            email: user.email || null,
            status: 'db_update_error',
            error: updateError?.message || String(updateError)
          });
        }
      } catch (hrError) {
        errorCount++;
        console.error(
          `❌ [sync-hr-unspecified] Error fetching HR data for username=${baseUsername} (user id=${user.id}):`,
          hrError?.message || hrError
        );
        details.push({
          user_id: user.id,
          ubuaccount: user.ubuaccount || null,
          email: user.email || null,
          status: 'hr_fetch_error',
          error: hrError?.message || String(hrError)
        });
      }
    }

    return res.json({
      success: true,
      total_candidates: candidates.length,
      attempted,
      updated: updatedCount,
      still_unspecified: stillUnspecified,
      hr_not_found: notFoundInHr,
      errors: errorCount,
      limit: limitNum,
      details
    });
  } catch (e) {
    console.error('❌ [sync-hr-unspecified] Unexpected error:', e);
    return res
      .status(500)
      .json({ error: 'Failed to sync users from HR', details: e?.message });
  } finally {
    client.release();
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
    const { firstName, lastName, email, studentId, department, apiKeyName, purpose, expectedUsage, courseName, otherDetails, creditLimit = 5 } = req.body;
    
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
      
      // Format Thai date: dd/mm/yyyy hh:mm:ss
      const now = new Date();
      const thaiDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear() + 543} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      // Build purpose text (include course_name or other_details if applicable)
      let purposeText = reqRow.purpose || '-';
      if (reqRow.expected_usage === 'การเรียนการสอน' && reqRow.course_name) {
        purposeText = `${purposeText} (รายวิชา: ${reqRow.course_name})`;
      } else if (reqRow.expected_usage === 'อื่นๆ' && reqRow.other_details) {
        purposeText = `${purposeText} (รายละเอียด: ${reqRow.other_details})`;
      }
      
      // Send notification in the requested format
      const lines = [
        `มีคำขอ API Key ใหม่`,
        ``,
        `ชื่อคีย์: ${reqRow.api_key_name}`,
        `ผู้ขอ: ${reqRow.first_name} ${reqRow.last_name} (${reqRow.email})`,
        `คณะ/หน่วยงาน: ${reqRow.department || '-'}`,
        `วัตถุประสงค์: ${purposeText}`,
        `คาดว่าใช้: ${reqRow.expected_usage || '-'}`,
        `เครดิต: $${Number(reqRow.credit_limit || 0).toFixed(2)}`,
        `เวลา: ${thaiDate}`,
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

// Track invite link click and send webhook to n8n
app.post('/api/invite/track', async (req, res) => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken) {
      return res.status(400).json({ error: 'Missing invite token' });
    }

    // Verify invite token
    const payload = verify(inviteToken);
    if (!payload || payload.type !== 'api_key_invite') {
      return res.status(400).json({ error: 'Invalid invite token' });
    }

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ error: 'Invite token expired' });
    }

    // Get comprehensive user and request info
    const client = await pool.connect();
    let userInfo = {};
    let requestInfo = {};
    let apiKeyInfo = {};
    
    try {
      // Get user info
      const userResult = await client.query(
        'SELECT id, email, fullname, ubuaccount, faculty, department_name, position FROM users WHERE id = $1',
        [payload.userId]
      );
      userInfo = userResult.rows[0] || {};
      
      // Get request info
      if (payload.requestId) {
        const requestResult = await client.query(
          `SELECT id, api_key_name, first_name, last_name, email, department, purpose, 
                  expected_usage, course_name, other_details, credit_limit, created_at 
           FROM api_key_requests WHERE id = $1`,
          [payload.requestId]
        );
        requestInfo = requestResult.rows[0] || {};
      }
      
      // Get API key info
      if (payload.keyId) {
        const keyResult = await client.query(
          `SELECT id, name, key_prefix, credit_limit, current_spend, provider, is_active, created_at 
           FROM api_keys WHERE id = $1`,
          [payload.keyId]
        );
        apiKeyInfo = keyResult.rows[0] || {};
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to fetch info for invite tracking:', dbError.message);
    } finally {
      client.release();
    }

    // Send webhook to n8n to track invite link click
    if (N8N_WEBHOOK_URL) {
      // Parse user agent for better insights
      const userAgent = req.get('user-agent') || '';
      const ip = req.ip || req.get('x-forwarded-for') || req.get('x-real-ip') || 'unknown';
      
      // Detect device type from user agent (simple detection)
      let deviceType = 'unknown';
      let browser = 'unknown';
      if (userAgent) {
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
          deviceType = 'mobile';
        } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
          deviceType = 'tablet';
        } else {
          deviceType = 'desktop';
        }
        
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
      }

      const webhookData = {
        event: 'invite_link_clicked',
        timestamp: new Date().toISOString(),
        // User Information
        user: {
          id: payload.userId,
          email: userInfo.email || null,
          fullname: userInfo.fullname || null,
          ubuaccount: userInfo.ubuaccount || null,
          faculty: userInfo.faculty || null,
          department: userInfo.department_name || null,
          position: userInfo.position || null
        },
        // Request Information
        request: {
          id: payload.requestId || null,
          apiKeyName: requestInfo.api_key_name || null,
          purpose: requestInfo.purpose || null,
          expectedUsage: requestInfo.expected_usage || null,
          department: requestInfo.department || null,
          requestedAt: requestInfo.created_at || null
        },
        // API Key Information
        apiKey: {
          id: payload.keyId || null,
          name: apiKeyInfo.name || null,
          keyPrefix: apiKeyInfo.key_prefix || null,
          creditLimit: apiKeyInfo.credit_limit ? Number(apiKeyInfo.credit_limit) : null,
          currentSpend: apiKeyInfo.current_spend ? Number(apiKeyInfo.current_spend) : null,
          provider: apiKeyInfo.provider || null,
          isActive: apiKeyInfo.is_active !== false,
          createdAt: apiKeyInfo.created_at || null
        },
        // Access Information
        access: {
          clickedAt: new Date().toISOString(),
          userAgent: userAgent,
          ip: ip,
          deviceType: deviceType,
          browser: browser,
          referer: req.get('referer') || null
        },
        // Token Information
        token: {
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
          isExpired: payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false,
          daysUntilExpiry: payload.exp ? Math.ceil((payload.exp - Math.floor(Date.now() / 1000)) / 86400) : null
        }
      };

      axios.post(N8N_WEBHOOK_URL, webhookData, { timeout: 5000 })
        .then(() => {
          console.log('✅ Invite link click tracked in n8n:', {
            event: webhookData.event,
            userId: webhookData.user.id,
            apiKeyName: webhookData.request.apiKeyName,
            deviceType: webhookData.access.deviceType
          });
        })
        .catch(err => {
          console.warn('⚠️ Failed to send invite tracking webhook to n8n (non-critical):', err?.message || err);
        });
    }

    res.json({ success: true, message: 'Invite link click tracked' });
  } catch (error) {
    console.error('Error tracking invite link click:', error);
    res.status(500).json({ error: 'Failed to track invite link click' });
  }
});

// Get user's API key requests
app.get('/api/requests', async (req, res) => {
  try {
    const session = verify(parseCookies(req).session);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For localhost, allow fallback if database connection fails
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    try {
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
    } catch (dbError) {
      // Log the actual database error for debugging
      console.error('❌ Database error in /api/requests:', dbError?.message || dbError);
      // Always throw error - no fallback mode (use real database)
      throw dbError;
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

    // Ensure user.id is a valid integer (database user_id is integer)
    let userId = user.id;
    if (typeof userId === 'string' && !/^\d+$/.test(userId)) {
      // User ID is a username string (from fallback mode), need to look up real ID from database
      const lookupClient = await pool.connect();
      try {
        const userResult = await lookupClient.query('SELECT id FROM users WHERE ubuaccount = $1 OR email = $2 LIMIT 1', [userId, user.email || '']);
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
        } else {
          // User not found in database, return empty array
          return res.json({ keys: [] });
        }
      } catch (lookupError) {
        console.error('❌ Error looking up user ID:', lookupError?.message || lookupError);
        return res.status(500).json({ error: 'Failed to lookup user', message: lookupError?.message || 'Database error' });
      } finally {
        lookupClient.release();
      }
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT *
          FROM api_keys
          WHERE user_id = $1
          ORDER BY created_at DESC
        `, [userId]);

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
    } catch (dbError) {
      // Log the actual database error for debugging
      console.error('❌ Database error in /api/keys:', dbError?.message || dbError);
      // Always throw error - no fallback mode (use real database)
      throw dbError;
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

    // For localhost, allow fallback if database connection fails
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    try {
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
    } catch (dbError) {
      // Log the actual database error for debugging
      console.error('❌ Database error in /api/requests:', dbError?.message || dbError);
      // Always throw error - no fallback mode (use real database)
      throw dbError;
    }
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
    
    // Generate invite token (JWT) for direct access to keys page
    // Token expires in 7 days and contains user_id and request_id
    const invitePayload = {
      userId: request.user_id,
      requestId: requestId,
      keyId: keyResult.rows[0].id,
      type: 'api_key_invite',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    const inviteToken = sign(invitePayload);
    
    // Create invite link (use BASE_URL or default to aigateway.ubu.ac.th)
    const frontendBaseUrl = BASE_URL.includes('dev2') ? 'https://aigateway.ubu.ac.th' : BASE_URL.replace('/ai_gateway_api', '').replace('/api', '') || 'https://aigateway.ubu.ac.th';
    const inviteLink = `${frontendBaseUrl}/keys?invite=${encodeURIComponent(inviteToken)}`;
    const apiKeyUrl = `${frontendBaseUrl}/keys`;
    
    // Send approval email
    const emailSubject = `คำขอ API Key ได้รับการอนุมัติ - ${request.api_key_name}`;
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
                      <a href="${inviteLink}" target="_blank" 
                        style="background-color:#10b981; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:6px; display:inline-block; font-weight:bold; font-size:16px; margin-bottom:10px;">
                        🎉 เข้าถึง API Key ของคุณ (คลิกที่นี่)
                      </a>
                    </p>
                    <p style="text-align:center; margin-top:15px;">
                      <a href="${apiKeyUrl}" target="_blank" 
                        style="color:#0077b6; text-decoration:underline; font-size:14px;">
                        หรือเข้าถึงผ่านหน้า Keys
                      </a>
                    </p>
                    <div style="background-color:#fff3cd; border-left:4px solid #ffc107; padding:12px; margin:20px 0; border-radius:4px;">
                      <p style="margin:0; font-size:14px; color:#856404;">
                        <strong>💡 หมายเหตุ:</strong> ลิงค์นี้ใช้ได้ 7 วัน หากหมดอายุสามารถเข้าถึงผ่านหน้า Keys ได้
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px; text-align:center; font-size:12px; color:#888888;">
                    ระบบ AI Gateway มหาวิทยาลัยอุบลราชธานี<br/>
                    <a href="https://aigateway.ubu.ac.th" style="color:#888888; text-decoration:none;">aigateway.ubu.ac.th</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
    const emailText = `เรียนคุณ ${recipientName},\n\nคำขอ API Key ของคุณได้รับการอนุมัติแล้ว\n\nชื่อคีย์: ${request.api_key_name}\nเครดิต: $${Number(request.credit_limit || 0).toFixed(2)}\nคณะ/หน่วยงาน: ${request.department || '-'}\n\n🎉 เข้าถึง API Key ของคุณ: ${inviteLink}\n(ลิงค์นี้ใช้ได้ 7 วัน)\n\nหรือเข้าถึงผ่าน: ${apiKeyUrl}`;
    
    // Send webhook to n8n when API key is approved (if configured)
    if (N8N_WEBHOOK_URL) {
      // Get additional user info for webhook
      const userInfo = userResult.rows[0] || {};
      const approvedKey = keyResult.rows[0];
      
      const webhookData = {
        event: 'api_key_approved',
        timestamp: new Date().toISOString(),
        // User Information
        user: {
          id: request.user_id,
          email: userEmail,
          fullname: userInfo.fullname || `${request.first_name} ${request.last_name}`,
          ubuaccount: userInfo.ubuaccount || null,
          faculty: userInfo.faculty || null,
          department: userInfo.department_name || request.department || null,
          position: userInfo.position || null
        },
        // Request Information
        request: {
          id: requestId,
          apiKeyName: request.api_key_name,
          purpose: request.purpose || null,
          expectedUsage: request.expected_usage || null,
          courseName: request.course_name || null,
          otherDetails: request.other_details || null,
          studentId: request.student_id || null,
          department: request.department || null,
          requestedAt: request.created_at || null
        },
        // API Key Information
        apiKey: {
          id: approvedKey.id,
          name: approvedKey.name,
          keyPrefix: approvedKey.key_prefix || null,
          creditLimit: Number(approvedKey.credit_limit || 0),
          currentSpend: Number(approvedKey.current_spend || 0),
          provider: approvedKey.provider || 'local',
          isActive: approvedKey.is_active !== false
        },
        // Invite Link Information
        invite: {
          link: inviteLink,
          tokenExpiresAt: new Date(invitePayload.exp * 1000).toISOString(),
          expiresInDays: 7
        },
        // System Information
        system: {
          baseUrl: frontendBaseUrl,
          approvedBy: session?.user?.id || 'system',
          approvedByRole: session?.user?.role || 'ADMIN'
        }
      };

      axios.post(N8N_WEBHOOK_URL, webhookData, { timeout: 5000 })
        .then(() => {
          console.log('✅ API key approval webhook sent to n8n:', {
            event: webhookData.event,
            userId: webhookData.user.id,
            apiKeyName: webhookData.request.apiKeyName
          });
        })
        .catch(err => {
          console.warn('⚠️ Failed to send webhook to n8n (non-critical):', err?.message || err);
        });
      
      // Send invite to n8n for users who haven't used n8n yet
      const N8N_INVITE_WEBHOOK_URL = process.env.N8N_INVITE_WEBHOOK_URL || '';
      if (N8N_INVITE_WEBHOOK_URL) {
        const inviteWebhookData = {
          event: 'invite_user_to_n8n',
          timestamp: new Date().toISOString(),
          user: {
            id: request.user_id,
            email: userEmail,
            firstName: request.first_name,
            lastName: request.last_name,
            fullname: userInfo.fullname || `${request.first_name} ${request.last_name}`,
            ubuaccount: userInfo.ubuaccount || null,
            faculty: userInfo.faculty || null,
            department: userInfo.department_name || request.department || null,
            position: userInfo.position || null
          }
        };
        
        axios.post(N8N_INVITE_WEBHOOK_URL, inviteWebhookData, { timeout: 5000 })
          .then(() => {
            console.log('✅ Invite user to n8n webhook sent:', {
              event: inviteWebhookData.event,
              userId: inviteWebhookData.user.id,
              email: inviteWebhookData.user.email
            });
          })
          .catch(err => {
            console.warn('⚠️ Failed to send invite webhook to n8n (non-critical):', err?.message || err);
          });
      }
    }

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

// ============================================
// n8n API Endpoints (for n8n workflows)
// ============================================

// API Key Approvals - GET: List all approvals
app.get('/api/n8n/approvals', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const client = await pool.connect();
    try {
      // Get all approved API keys with request and user info
      const result = await client.query(`
        SELECT 
          ak.id as api_key_id,
          ak.name as api_key_name,
          ak.key_prefix,
          ak.credit_limit,
          ak.current_spend,
          ak.provider,
          ak.is_active,
          ak.created_at as api_key_created_at,
          akr.id as request_id,
          akr.api_key_name as request_name,
          akr.first_name,
          akr.last_name,
          akr.email,
          akr.student_id,
          akr.department,
          akr.purpose,
          akr.expected_usage,
          akr.course_name,
          akr.other_details,
          akr.credit_limit as request_credit_limit,
          akr.created_at as request_created_at,
          akr.updated_at as request_updated_at,
          u.id as user_id,
          u.ubuaccount,
          u.fullname as user_fullname,
          u.faculty,
          u.department_name as user_department,
          u.position
        FROM api_keys ak
        LEFT JOIN api_key_requests akr ON ak.request_id = akr.id
        LEFT JOIN users u ON ak.user_id = u.id
        WHERE akr.status = 'approved'
        ORDER BY ak.created_at DESC
        LIMIT 1000
      `);
      
      res.json({ 
        success: true,
        count: result.rows.length,
        approvals: result.rows 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// API Key Approvals - POST: Log approval (for n8n to store)
app.post('/api/n8n/approvals', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const {
      event_type = 'api_key_approved',
      timestamp,
      user_id,
      user_email,
      user_name,
      user_faculty,
      user_department,
      request_id,
      api_key_name,
      api_key_id,
      credit_limit,
      current_spend,
      invite_link,
      token_expires_at,
      approved_by,
      purpose,
      expected_usage
    } = req.body;

    // Store in database (create table if needed)
    const client = await pool.connect();
    try {
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS n8n_api_key_approvals (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          user_id INTEGER,
          user_email VARCHAR(255),
          user_name VARCHAR(255),
          user_faculty VARCHAR(255),
          user_department VARCHAR(255),
          request_id INTEGER,
          api_key_name VARCHAR(255),
          api_key_id INTEGER,
          credit_limit DECIMAL(10,2),
          current_spend DECIMAL(10,2),
          invite_link TEXT,
          token_expires_at TIMESTAMP WITH TIME ZONE,
          approved_by INTEGER,
          purpose TEXT,
          expected_usage VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Insert approval record
      await client.query(`
        INSERT INTO n8n_api_key_approvals (
          event_type, timestamp, user_id, user_email, user_name, user_faculty, user_department,
          request_id, api_key_name, api_key_id, credit_limit, current_spend,
          invite_link, token_expires_at, approved_by, purpose, expected_usage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        event_type,
        timestamp ? new Date(timestamp) : new Date(),
        user_id || null,
        user_email || null,
        user_name || null,
        user_faculty || null,
        user_department || null,
        request_id || null,
        api_key_name || null,
        api_key_id || null,
        credit_limit || null,
        current_spend || null,
        invite_link || null,
        token_expires_at ? new Date(token_expires_at) : null,
        approved_by || null,
        purpose || null,
        expected_usage || null
      ]);

      res.json({ success: true, message: 'Approval logged successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error logging approval:', error);
    res.status(500).json({ error: 'Failed to log approval' });
  }
});

// Invite Link Clicks - GET: List all clicks
app.get('/api/n8n/invite-clicks', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM n8n_invite_analytics
        ORDER BY clicked_at DESC
        LIMIT 1000
      `);
      
      res.json({ 
        success: true,
        count: result.rows.length,
        clicks: result.rows 
      });
    } catch (error) {
      // Table might not exist yet
      if (error.message.includes('does not exist')) {
        return res.json({ success: true, count: 0, clicks: [] });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching invite clicks:', error);
    res.status(500).json({ error: 'Failed to fetch invite clicks' });
  }
});

// Invite Link Clicks - POST: Log click (for n8n to store)
app.post('/api/n8n/invite-clicks', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const {
      event_type = 'invite_link_clicked',
      timestamp,
      user_id,
      user_email,
      user_name,
      api_key_name,
      api_key_id,
      clicked_at,
      device_type,
      browser,
      ip_address,
      referer,
      user_agent,
      days_until_expiry,
      is_expired
    } = req.body;

    // Store in database (create table if needed)
    const client = await pool.connect();
    try {
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS n8n_invite_analytics (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          user_id INTEGER,
          user_email VARCHAR(255),
          user_name VARCHAR(255),
          api_key_name VARCHAR(255),
          api_key_id INTEGER,
          clicked_at TIMESTAMP WITH TIME ZONE,
          device_type VARCHAR(50),
          browser VARCHAR(100),
          ip_address VARCHAR(50),
          referer TEXT,
          user_agent TEXT,
          days_until_expiry INTEGER,
          is_expired BOOLEAN,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Insert click record
      await client.query(`
        INSERT INTO n8n_invite_analytics (
          event_type, timestamp, user_id, user_email, user_name,
          api_key_name, api_key_id, clicked_at, device_type, browser,
          ip_address, referer, user_agent, days_until_expiry, is_expired
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        event_type,
        timestamp ? new Date(timestamp) : new Date(),
        user_id || null,
        user_email || null,
        user_name || null,
        api_key_name || null,
        api_key_id || null,
        clicked_at ? new Date(clicked_at) : new Date(),
        device_type || null,
        browser || null,
        ip_address || null,
        referer || null,
        user_agent || null,
        days_until_expiry || null,
        is_expired || false
      ]);

      res.json({ success: true, message: 'Invite click logged successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error logging invite click:', error);
    res.status(500).json({ error: 'Failed to log invite click' });
  }
});

// POST /api/n8n/create-invite - Create n8n invite link via n8n API
app.post('/api/n8n/create-invite', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        error: 'Missing required field: email is required' 
      });
    }

    console.log('📧 Creating n8n invitation for email:', email);

    // Get n8n API credentials from environment
    const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.ubu.ac.th';
    const N8N_USER_EMAIL = process.env.N8N_USER_EMAIL || '';
    const N8N_USER_PASSWORD = process.env.N8N_USER_PASSWORD || '';
    const N8N_API_KEY = process.env.N8N_API_KEY || '';
    
    console.log('🔑 n8n credentials check:', {
      hasApiKey: !!N8N_API_KEY,
      hasUserEmail: !!N8N_USER_EMAIL,
      hasUserPassword: !!N8N_USER_PASSWORD,
      baseUrl: N8N_BASE_URL
    });
    
    // Try to use API key first, then fallback to session cookie
    let inviteLink = null;
    let invitationData = null;

    try {
      // Method 1: Try using n8n API Key (if available)
      if (N8N_API_KEY) {
        try {
          // n8n API expects an array of objects with 'email' field
          const n8nResponse = await axios.post(
            `${N8N_BASE_URL}/rest/invitations`,
            [{ email: email }],
            {
              headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );

          // n8n API returns response with structure: { data: [{ user: {...}, error: "" }] }
          // Extract the first invitation from the data array
          const responseData = n8nResponse.data?.data || n8nResponse.data;
          const invitation = Array.isArray(responseData) ? responseData[0] : responseData;
          invitationData = invitation;
          
          console.log('📋 n8n invitation response (API Key):', JSON.stringify(invitation, null, 2));
          
          // Extract user info from response
          const inviteeUser = invitation?.user;
          const inviteeId = inviteeUser?.id || invitation?.inviteeId || invitation?.invitee?.id || email;
          const inviteeEmail = inviteeUser?.email || invitation?.email || email;
          
          // Get inviter ID from response or use empty (will be set by n8n)
          const inviterId = invitation?.inviterId || invitation?.inviter?.id || '';
          
          // Extract invite link from response
          inviteLink = invitation?.inviteAcceptUrl || 
                      invitation?.inviteUrl ||
                      invitation?.url ||
                      invitation?.link ||
                      invitation?.signupUrl ||
                      `${N8N_BASE_URL}/signup?inviterId=${inviterId}&inviteeId=${inviteeId}`;
          
          console.log('✅ Created n8n invitation (API Key):', { 
            email: inviteeEmail, 
            inviteLink, 
            inviteeId,
            inviterId,
            emailSent: inviteeUser?.emailSent
          });
        } catch (apiKeyError) {
          console.warn('⚠️ Failed to create invite using API key, trying session cookie:', apiKeyError?.response?.data || apiKeyError?.message);
          // Fall through to session cookie method
        }
      }

      // Method 2: Use session cookie authentication (login first, then create invitation)
      if (!inviteLink && N8N_USER_EMAIL && N8N_USER_PASSWORD) {
        try {
          console.log('🔐 Attempting to login to n8n with email:', N8N_USER_EMAIL);
          console.log('📧 Target email for invitation:', email);
          
          // Step 1: Login to get session cookie
          // Use axios instance with cookie jar support
          const axiosInstance = axios.create({
            withCredentials: true,
            timeout: 10000
          });

          let loginResponse;
          try {
            // n8n login API also expects 'emailOrLdapLoginId' field, not 'email'
            loginResponse = await axiosInstance.post(
              `${N8N_BASE_URL}/rest/login`,
              {
                emailOrLdapLoginId: N8N_USER_EMAIL,
                password: N8N_USER_PASSWORD
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('✅ Login successful, status:', loginResponse.status);
            console.log('🍪 Login response headers:', Object.keys(loginResponse.headers));
          } catch (loginError) {
            console.error('❌ Login failed:', {
              status: loginError?.response?.status,
              statusText: loginError?.response?.statusText,
              data: loginError?.response?.data,
              message: loginError?.message
            });
            throw loginError;
          }
          console.log('🍪 Login response headers:', Object.keys(loginResponse.headers));

          // Extract cookies from response
          const cookies = loginResponse.headers['set-cookie'] || [];
          console.log('🍪 Cookies received:', cookies.length, 'cookies');
          
          let sessionCookie = null;
          
          // Try to find n8n-auth cookie or any cookie
          for (const cookie of cookies) {
            console.log('🍪 Checking cookie:', cookie.substring(0, 50) + '...');
            if (cookie.includes('n8n-auth') || cookie.includes('session') || cookie.includes('connect.sid')) {
              sessionCookie = cookie.split(';')[0];
              console.log('✅ Found session cookie:', sessionCookie.substring(0, 30) + '...');
              break;
            }
          }
          
          // If no specific cookie found, use first cookie
          if (!sessionCookie && cookies.length > 0) {
            sessionCookie = cookies[0].split(';')[0];
            console.log('⚠️ Using first cookie as fallback:', sessionCookie.substring(0, 30) + '...');
          }

          if (sessionCookie) {
            console.log('✅ Got session cookie from n8n login');
            console.log('📧 Email variable value (before request):', email);
            console.log('📧 Email type:', typeof email);
            console.log('📧 Email is defined:', email !== undefined);
            console.log('📧 Email is truthy:', !!email);
            
            // Step 2: Create invitation using session cookie
            // n8n API expects 'emailOrLdapLoginId' field, not 'email'
            // Make sure email is defined and not undefined
            // Use the email from the outer scope (from req.body)
            const targetEmail = email;
            
            if (!targetEmail || targetEmail === undefined) {
              console.error('❌ Email is undefined! Email value:', targetEmail);
              throw new Error(`Email is undefined when trying to create invitation. Email value: ${targetEmail}`);
            }
            
            console.log('📤 Sending invitation request with emailOrLdapLoginId:', targetEmail);
            
            // n8n API expects an array of objects with 'email' field
            const requestBody = [{ email: targetEmail }];
            console.log('📦 Request body:', JSON.stringify(requestBody));
            console.log('🌐 Request URL:', `${N8N_BASE_URL}/rest/invitations`);
            
            const inviteResponse = await axiosInstance.post(
              `${N8N_BASE_URL}/rest/invitations`,
              requestBody,
              {
                headers: {
                  'Cookie': sessionCookie,
                  'Content-Type': 'application/json',
                  'Referer': N8N_BASE_URL
                }
              }
            );

            // n8n API returns response with structure: { data: [{ user: {...}, error: "" }] }
            // Extract the first invitation from the data array
            const responseData = inviteResponse.data?.data || inviteResponse.data;
            const invitation = Array.isArray(responseData) ? responseData[0] : responseData;
            invitationData = invitation;
            
            console.log('📋 n8n invitation response:', JSON.stringify(invitation, null, 2));
            console.log('📋 Full n8n invitation response data:', JSON.stringify(inviteResponse.data, null, 2));
            
            // Extract user info from response
            const inviteeUser = invitation?.user;
            const inviteeId = inviteeUser?.id || invitation?.inviteeId || invitation?.invitee?.id || email;
            const inviteeEmail = inviteeUser?.email || invitation?.email || email;
            
            // Check if n8n provided an invite link in the response
            console.log('🔍 Checking for invite link in response:', {
              inviteAcceptUrl: invitation?.inviteAcceptUrl,
              inviteUrl: invitation?.inviteUrl,
              url: invitation?.url,
              link: invitation?.link,
              signupUrl: invitation?.signupUrl,
              inviteeId: inviteeId,
              inviterId: invitation?.inviterId || invitation?.inviter?.id
            });
            
            // Get inviter ID - try to get from current logged-in user
            // We need to get the current user's ID from n8n
            let inviterId = invitation?.inviterId || invitation?.inviter?.id || '';
            
            // If inviterId is empty, try to get current user info from n8n
            // Try different endpoints to get current user ID
            if (!inviterId) {
              // Method 1: Try /rest/users - get list and find current user by email
              try {
                const usersResponse = await axiosInstance.get(
                  `${N8N_BASE_URL}/rest/users`,
                  {
                    headers: {
                      'Cookie': sessionCookie,
                      'Content-Type': 'application/json',
                      'Referer': N8N_BASE_URL
                    }
                  }
                );
                // n8n API returns { data: { count: X, items: [...] } }
                const responseData = usersResponse.data;
                console.log('👥 Users list response structure:', {
                  hasData: !!responseData?.data,
                  hasItems: !!responseData?.data?.items,
                  itemsLength: responseData?.data?.items?.length,
                  isArray: Array.isArray(responseData)
                });
                
                // Extract users from responseData.data.items (nested structure)
                const users = responseData?.data?.items || responseData?.items || responseData?.data || (Array.isArray(responseData) ? responseData : []);
                console.log('👥 Users array length:', users.length);
                
                if (Array.isArray(users) && users.length > 0) {
                  console.log('👥 First user email:', users[0]?.email);
                  const currentUser = users.find(u => u.email === N8N_USER_EMAIL);
                  inviterId = currentUser?.id || '';
                  if (inviterId) {
                    console.log('👤 Got current user ID from /rest/users:', inviterId, 'for email:', N8N_USER_EMAIL);
                  } else {
                    console.warn('⚠️ Current user not found in users list. Looking for:', N8N_USER_EMAIL);
                    console.warn('⚠️ Available emails:', users.map(u => u.email).slice(0, 5).join(', '), '...');
                  }
                } else {
                  console.warn('⚠️ Users list is not an array or is empty');
                }
              } catch (usersError) {
                console.warn('⚠️ Could not get current user ID from /rest/users:', usersError?.response?.status || usersError?.message);
              }
              
              // Method 2: Try /rest/owner - might return owner/admin info
              if (!inviterId) {
                try {
                  const ownerResponse = await axiosInstance.get(
                    `${N8N_BASE_URL}/rest/owner`,
                    {
                      headers: {
                        'Cookie': sessionCookie,
                        'Content-Type': 'application/json',
                        'Referer': N8N_BASE_URL
                      }
                    }
                  );
                  inviterId = ownerResponse.data?.id || ownerResponse.data?.data?.id || ownerResponse.data?.data?.user?.id || '';
                  if (inviterId) {
                    console.log('👤 Got current user ID from /rest/owner:', inviterId);
                  }
                } catch (ownerError) {
                  // Ignore - try next method
                }
              }
              
              // If still no inviterId, use inviteeId as fallback (n8n might accept it)
              // Or leave it empty - n8n might handle it automatically when emailSent is true
              if (!inviterId) {
                console.warn('⚠️ Could not get inviterId - using empty string (n8n may handle it automatically since emailSent=true)');
                // Note: n8n has already sent the email, so the invite link might be in that email
              }
            }
            
            // Extract invite link from response
            inviteLink = invitation?.inviteAcceptUrl || 
                        invitation?.inviteUrl ||
                        invitation?.url ||
                        invitation?.link ||
                        invitation?.signupUrl ||
                        `${N8N_BASE_URL}/signup?inviterId=${inviterId}&inviteeId=${inviteeId}`;
            
            console.log('✅ Created n8n invitation successfully:', { 
              email: inviteeEmail, 
              inviteLink, 
              inviteeId,
              inviterId,
              invitationId: invitation?.id,
              emailSent: inviteeUser?.emailSent
            });
          } else {
            console.warn('⚠️ No session cookie received from n8n login');
          }
        } catch (sessionError) {
          console.error('⚠️ Failed to create invite using session cookie:', {
            status: sessionError?.response?.status,
            statusText: sessionError?.response?.statusText,
            data: sessionError?.response?.data,
            message: sessionError?.message
          });
        }
      }

      // If both methods failed, return error
      if (!inviteLink) {
        return res.status(500).json({ 
          error: 'Failed to create n8n invitation',
          message: 'Both API key and session cookie methods failed. Please check N8N_API_KEY or N8N_USER_EMAIL/N8N_USER_PASSWORD configuration.',
          details: {
            hasApiKey: !!N8N_API_KEY,
            hasUserCredentials: !!(N8N_USER_EMAIL && N8N_USER_PASSWORD)
          }
        });
      }

      res.json({ 
        success: true, 
        inviteLink,
        invitation: invitationData
      });
    } catch (error) {
      console.error('Error creating n8n invite:', error);
      return res.status(500).json({ 
        error: 'Failed to create invite',
        message: error?.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error creating n8n invite:', error);
    res.status(500).json({ 
      error: 'Failed to create invite',
      message: error?.message || 'Unknown error'
    });
  }
});

// GET /api/n8n/check-user - Check if user exists in n8n
app.get('/api/n8n/check-user', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const { email } = req.query;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        error: 'Missing required field: email is required' 
      });
    }

    console.log('🔍 Checking if user exists in n8n:', email);

    // Get n8n API credentials from environment
    const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.ubu.ac.th';
    const N8N_USER_EMAIL = process.env.N8N_USER_EMAIL || '';
    const N8N_USER_PASSWORD = process.env.N8N_USER_PASSWORD || '';

    // Login to n8n to get session cookie
    let sessionCookie = '';
    try {
      const loginResponse = await axios.post(
        `${N8N_BASE_URL}/rest/login`,
        {
          emailOrLdapLoginId: N8N_USER_EMAIL,
          password: N8N_USER_PASSWORD
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': N8N_BASE_URL
          },
          withCredentials: true
        }
      );

      if (loginResponse.status === 200) {
        const cookies = loginResponse.headers['set-cookie'] || [];
        const authCookie = cookies.find(c => c.startsWith('n8n-auth='));
        if (authCookie) {
          sessionCookie = authCookie.split(';')[0];
          console.log('✅ Login successful for user check');
        }
      }
    } catch (loginError) {
      console.warn('⚠️ Failed to login to n8n for user check:', loginError?.response?.status || loginError?.message);
      return res.status(500).json({ 
        error: 'Failed to authenticate with n8n',
        message: loginError?.message || 'Unknown error'
      });
    }

    // Get users list from n8n
    try {
      const usersResponse = await axios.get(
        `${N8N_BASE_URL}/rest/users`,
        {
          headers: {
            'Cookie': sessionCookie,
            'Content-Type': 'application/json',
            'Referer': N8N_BASE_URL
          }
        }
      );

      const responseData = usersResponse.data;
      const users = responseData?.data?.items || responseData?.items || responseData?.data || (Array.isArray(responseData) ? responseData : []);
      
      // Check if email exists in users list
      const userExists = Array.isArray(users) && users.some(u => 
        (u.email || '').toLowerCase() === email.toLowerCase()
      );

      console.log(`👤 User ${email} exists in n8n:`, userExists);

      res.json({ 
        exists: userExists,
        email: email
      });
    } catch (usersError) {
      console.error('❌ Failed to get users list from n8n:', usersError?.response?.status || usersError?.message);
      return res.status(500).json({ 
        error: 'Failed to check user in n8n',
        message: usersError?.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ 
      error: 'Failed to check user',
      message: error?.message || 'Unknown error'
    });
  }
});

// POST /api/n8n/send-email - Send email via n8n workflow
app.post('/api/n8n/send-email', async (req, res) => {
  try {
    // Simple API key authentication for n8n
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedApiKey = process.env.N8N_API_KEY || '';
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const {
      to,
      subject,
      html,
      text
    } = req.body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({ 
        error: 'Missing required fields: to and subject are required' 
      });
    }

    // Send email using existing helper function
    await sendEmail(
      to,
      subject,
      html || text || '',
      text || html || ''
    );

    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      to,
      subject
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      message: error?.message || 'Unknown error'
    });
  }
});

// Admin: Get settings
app.get('/api/admin/settings', async (req, res) => {
  const cookies = parseCookies(req);
  const session = verify(cookies.session);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // For localhost, allow fallback if database connection fails
  const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
  const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  try {
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
    } finally {
      client.release();
    }
  } catch (dbError) {
    // Log the actual database error for debugging
    console.error('❌ Database error in /api/admin/settings:', dbError?.message || dbError);
    // Always throw error - no fallback mode (use real database)
    res.status(500).json({ error: 'Failed to fetch settings', message: dbError?.message || 'Database connection failed' });
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
  
  console.log(`🔔 [auto-disable-inactive] Auto-disable request initiated by admin: ${session.user.email || session.user.id} at ${new Date().toISOString()}`);
  
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
    
    console.log(`🔍 [auto-disable-inactive] Found ${inactiveKeys.rows.length} inactive keys (cutoff: ${cutoffDate.toISOString()}, days: ${days})`);
    
    let disabledCount = 0;
    for (const key of inactiveKeys.rows) {
      // Double-check: Don't disable if key was used recently (within last 24 hours)
      const lastUsed = key.last_used_at ? new Date(key.last_used_at) : null;
      const hoursSinceLastUse = lastUsed ? (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60) : Infinity;
      
      if (hoursSinceLastUse < 24) {
        console.log(`⚠️ [auto-disable-inactive] Skipping key ${key.id} (${key.name}): used ${hoursSinceLastUse.toFixed(1)} hours ago (too recent)`);
        continue;
      }
      
      console.log(`🔄 [auto-disable-inactive] Disabling key ${key.id} (${key.name}): last used ${lastUsed ? lastUsed.toISOString() : 'never'}`);
      
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
  
  // For localhost, allow fallback if database connection fails
  const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
  const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:4000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  try {
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
  } catch (dbError) {
    // Log the actual database error for debugging
    console.error('❌ Database error in /api/notifications:', dbError?.message || dbError);
    // Always throw error - no fallback mode (use real database)
    res.status(500).json({ error: 'Failed to fetch notifications', message: dbError?.message || 'Database connection failed' });
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
    // Declare variables outside try block so they're accessible in catch block
    let token = null;
    let useKey = null;
    let keyId = null;
    let userId = null;
    
    try {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_bearer_token' });
      token = auth.slice('Bearer '.length).trim();
      
      // Resolve actual OpenRouter key from gateway API key
      useKey = token;
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
            // Don't auto-disable, just reject the request
            // Admin can manually disable if needed
            return res.status(403).json({ 
              error: 'credit_exhausted', 
              message: 'Credit limit has been reached. Please contact administrator to increase your credit limit.',
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
            // Validate provider key format (should be a valid OpenRouter key)
            if (useKey.length < 20) {
              console.warn(`   ⚠️ Provider key seems invalid (too short), falling back to global token`);
              if (OPENROUTER_TOKEN) {
                useKey = OPENROUTER_TOKEN;
                console.log(`   ℹ️ Using global OPENROUTER_TOKEN as fallback`);
              }
            }
          }
        } else {
          // Not a gateway key, use as-is (might be direct OpenRouter key)
          console.log('   Using provided token as direct provider key');
        }
      } finally {
        client.release();
      }
      
      console.log(`   🔑 Using provider key: ${useKey ? useKey.substring(0, 12) + '...' : 'MISSING'}`);
      console.log(`   📍 Forwarding to: ${targetUrl}`);
      
      // Normalize request body - ensure model is a string, not an object
      const requestBody = { ...(req.body || {}) };
      if (requestBody.model && typeof requestBody.model !== 'string') {
        // If model is an object, try to extract the model ID
        if (typeof requestBody.model === 'object' && requestBody.model !== null) {
          requestBody.model = requestBody.model.id || requestBody.model.name || String(requestBody.model);
        } else {
          requestBody.model = String(requestBody.model);
        }
        console.log(`   🔄 Normalized model field: ${requestBody.model}`);
      }
      
      const { data } = await axios.post(targetUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${useKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'https://aigateway.ubu.ac.th/',
          'X-Title': 'UBU AI SERVICE'
        },
        timeout: 30000
      });
      
      // Log usage if this was a gateway key
      if (token.startsWith('ubu_') && keyId && userId) {
        try {
          // Determine action type from URL
          let action = 'chat.completions';
          if (targetUrl.includes('/embeddings')) {
            action = 'embeddings';
          } else if (targetUrl.includes('/images')) {
            action = 'images.generations';
          }
          
          const usage = data?.usage || {};
          const tokensIn = Number(usage?.prompt_tokens || usage?.input_tokens || usage?.total_tokens || 0);
          const tokensOut = Number(usage?.completion_tokens || usage?.output_tokens || 0);
          
          // Debug: Log OpenRouter response to see what cost fields are available
          console.log(`   🔍 OpenRouter response usage:`, {
            prompt_tokens: usage?.prompt_tokens,
            completion_tokens: usage?.completion_tokens,
            total_tokens: usage?.total_tokens,
            total_cost: usage?.total_cost,
            cost: usage?.cost,
            all_usage_keys: Object.keys(usage || {})
          });
          
          // Calculate cost: try multiple possible fields from OpenRouter response
          let cost = Number(usage?.total_cost || usage?.cost || usage?.usage?.total_cost || data?.cost || 0);
          
          // If cost is still 0 or invalid, calculate from pricing
          if (!Number.isFinite(cost) || cost === 0) {
            const modelId = data?.model || req.body?.model || 'unknown';
            console.log(`   💰 Cost not in response, calculating from OpenRouter pricing for model: ${modelId}`);
            // Try to get pricing from OpenRouter (with retry if cache is stale)
            let pricing = await getModelPricingPerM(modelId);
            // If not found and cache might be stale, try refreshing
            if (!pricing && modelsCache.ts && (Date.now() - modelsCache.ts) < MODELS_CACHE_MS) {
              console.log(`   🔄 Retrying with cache refresh for model: ${modelId}`);
              pricing = await getModelPricingPerM(modelId, true);
            }
            if (pricing && Number.isFinite(pricing.inM) && Number.isFinite(pricing.outM)) {
              cost = (tokensIn / 1_000_000) * pricing.inM + (tokensOut / 1_000_000) * pricing.outM;
              console.log(`   💰 Calculated cost from pricing: $${cost.toFixed(6)} (${tokensIn} in, ${tokensOut} out, inM: ${pricing.inM}, outM: ${pricing.outM})`);
            } else {
              // Fallback to comprehensive static table if pricing not found
              const mname = String(modelId).toLowerCase();
              const table = [
                // OpenAI models
                { match: 'gpt-4o', inM: 5, outM: 15 },
                { match: 'gpt-4o-mini', inM: 0.5, outM: 1.5 },
                { match: 'gpt-4-turbo', inM: 10, outM: 30 },
                { match: 'gpt-4', inM: 30, outM: 60 },
                { match: 'gpt-3.5-turbo', inM: 0.5, outM: 1.5 },
                { match: 'gpt-5', inM: 2.5, outM: 10 },
                { match: 'gpt-5.2', inM: 2.5, outM: 10 },
                { match: 'gpt-5-mini', inM: 0.15, outM: 0.6 },
                { match: 'gpt-5-nano', inM: 0.1, outM: 0.4 },
                // Google models
                { match: 'gemini-2.5-pro', inM: 0.125, outM: 0.5 },
                { match: 'gemini-2.5-flash', inM: 0.075, outM: 0.3 },
                { match: 'gemini-3-flash', inM: 0.075, outM: 0.3 },
                // Anthropic models
                { match: 'claude-3.5-sonnet', inM: 3, outM: 15 },
                { match: 'claude-3.7-sonnet', inM: 3, outM: 15 },
                { match: 'claude-3-haiku', inM: 0.25, outM: 1.25 },
                { match: 'claude-sonnet-4.5', inM: 3, outM: 15 },
                // Embedding models (input only, no output)
                { match: 'text-embedding-3-large', inM: 0.13, outM: 0 },
                { match: 'text-embedding-3-small', inM: 0.02, outM: 0 },
                { match: 'text-embedding-ada-002', inM: 0.1, outM: 0 },
                // Free models (set to minimal cost to track usage)
                { match: ':free', inM: 0, outM: 0 },
                // DALL-E (image generation - estimate based on size)
                { match: 'dall-e-3', inM: 0.04, outM: 0 }, // $0.04 per image
              ];
              let inM = 0, outM = 0;
              for (const t of table) {
                if (mname.includes(t.match)) {
                  inM = t.inM;
                  outM = t.outM;
                  break;
                }
              }
              if (inM || outM) {
                // For embedding models, cost is per input token only
                // For image models, estimate cost (DALL-E is per image, not per token)
                if (mname.includes('dall-e')) {
                  // DALL-E: estimate $0.04 per image (1 image = ~1000 tokens equivalent)
                  cost = tokensIn > 0 ? 0.04 : 0;
                  console.log(`   💰 Calculated cost for image model (DALL-E): $${cost.toFixed(6)}`);
                } else {
                  cost = (tokensIn / 1_000_000) * inM + (tokensOut / 1_000_000) * outM;
                  console.log(`   💰 Calculated cost from fallback table: $${cost.toFixed(6)} (${tokensIn} in, ${tokensOut} out, inM: ${inM}, outM: ${outM})`);
                }
              } else {
                // If no pricing found, try to estimate from a default rate (conservative estimate)
                // Use a default rate of $1 per 1M tokens as fallback
                const defaultRate = 1.0;
                cost = ((tokensIn + tokensOut) / 1_000_000) * defaultRate;
                console.warn(`   ⚠️ No pricing found for model: ${modelId}, using default rate $${defaultRate}/M tokens: $${cost.toFixed(6)}`);
              }
            }
          } else {
            console.log(`   ✅ Using cost from OpenRouter response: $${cost.toFixed(6)}`);
          }
          
          const client2 = await pool.connect();
          try {
            await client2.query(`
              INSERT INTO api_usage_logs (api_key_id, user_id, provider, action, model, tokens_input, tokens_output, cost_usd, status_code, response_time_ms)
              VALUES ($1, $2, 'openrouter', $3, $4, $5, $6, $7, 200, 0)
            `, [keyId, userId, action, data?.model || req.body?.model || 'unknown', tokensIn, tokensOut, cost]);
            
            // Update last_used_at and current_spend for the API key
            await client2.query('UPDATE api_keys SET last_used_at = timezone(\'Asia/Bangkok\', now()), current_spend = COALESCE(current_spend, 0) + $2 WHERE id = $1', [keyId, cost]);
            console.log(`   📊 Logged usage (${action}): ${tokensIn + tokensOut} tokens, $${cost.toFixed(6)}`);
          } catch (logError) {
            console.error(`   ❌ Error logging usage:`, logError?.message || logError);
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
      const errorData = e?.response?.data || {};
      const errorMessage = errorData?.error?.message || errorData?.message || e?.message || 'Unknown error';
      
      // Log detailed error for debugging
      console.error(`   ❌ OpenRouter API error (${status}):`, {
        message: errorMessage,
        code: errorData?.error?.code || errorData?.code,
        details: errorData
      });
      
      // Provide more helpful error messages
      if (status === 401) {
        if (errorMessage.includes('User not found') || errorMessage.includes('Invalid')) {
          console.log(`   🔍 Debug info: token=${token ? token.substring(0, 8) + '...' : 'null'}, keyId=${keyId}, useKey=${useKey ? useKey.substring(0, 12) + '...' : 'null'}, hasGlobalToken=${!!OPENROUTER_TOKEN}`);
          
          // Try fallback if:
          // 1. This is a gateway key (starts with ubu_)
          // 2. We have a keyId (meaning it's a valid gateway key)
          // 3. We have a global OPENROUTER_TOKEN
          // Note: We try fallback even if useKey matches global token, because the stored key might be invalid/expired
          const shouldTryFallback = token && token.startsWith('ubu_') && keyId && OPENROUTER_TOKEN;
          
          if (shouldTryFallback) {
            const useKeyMatchesGlobal = useKey && OPENROUTER_TOKEN && useKey === OPENROUTER_TOKEN;
            
            // If provider key matches global token but failed, clear it from DB first
            if (useKeyMatchesGlobal && keyId) {
              const client3 = await pool.connect();
              try {
                await client3.query('UPDATE api_keys SET provider_key_value = NULL WHERE id = $1', [keyId]);
                console.log(`   🔄 Cleared invalid provider key from database (matched global token but failed)`);
              } finally {
                client3.release();
              }
            }
            
            console.warn(`   ⚠️ Provider key failed (${useKey ? 'dedicated key' : 'missing key'}), attempting fallback to global OPENROUTER_TOKEN`);
            try {
              const fallbackKey = OPENROUTER_TOKEN;
              console.log(`   🔄 Trying fallback with global token: ${fallbackKey.substring(0, 12) + '...'}`);
              
              const { data: fallbackData } = await axios.post(targetUrl, req.body || {}, {
                headers: {
                  Authorization: `Bearer ${fallbackKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'https://aigateway.ubu.ac.th/',
                  'X-Title': 'UBU AI SERVICE'
                },
                timeout: 30000
              });
              
              console.log(`   ✅ Fallback to global token succeeded`);
              
              // Update provider_key_value to null so it uses global token next time (if not already cleared)
              if (keyId && !useKeyMatchesGlobal) {
                const client3 = await pool.connect();
                try {
                  await client3.query('UPDATE api_keys SET provider_key_value = NULL WHERE id = $1', [keyId]);
                  console.log(`   🔄 Cleared invalid provider key from database`);
                } finally {
                  client3.release();
                }
              }
              
              // Log usage with fallback
              if (keyId && userId) {
                try {
                  const usage = fallbackData?.usage || {};
                  const tokensIn = Number(usage?.prompt_tokens || usage?.input_tokens || 0);
                  const tokensOut = Number(usage?.completion_tokens || usage?.output_tokens || 0);
                  // Calculate cost: use total_cost from OpenRouter if available, otherwise calculate from pricing
                  let cost = Number(usage?.total_cost || 0);
                  if (!Number.isFinite(cost) || cost === 0) {
                    const modelId = fallbackData?.model || req.body?.model || 'unknown';
                    const pricing = await getModelPricingPerM(modelId);
                    if (pricing && Number.isFinite(pricing.inM) && Number.isFinite(pricing.outM)) {
                      cost = (tokensIn / 1_000_000) * pricing.inM + (tokensOut / 1_000_000) * pricing.outM;
                    } else {
                      // Fallback to minimal static table if pricing not found
                      const mname = String(modelId).toLowerCase();
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
                  const client4 = await pool.connect();
                  try {
                    await client4.query(`
                      INSERT INTO api_usage_logs (api_key_id, user_id, provider, action, model, tokens_input, tokens_output, cost_usd, status_code, response_time_ms)
                      VALUES ($1, $2, 'openrouter', $3, $4, $5, $6, $7, 200, 0)
                    `, [keyId, userId, action, fallbackData?.model || req.body?.model || 'unknown', tokensIn, tokensOut, cost]);
                    await client4.query('UPDATE api_keys SET last_used_at = timezone(\'Asia/Bangkok\', now()) WHERE id = $1', [keyId]);
                    console.log(`   📊 Logged usage: ${tokensIn + tokensOut} tokens, $${cost.toFixed(4)}`);
                  } finally {
                    client4.release();
                  }
                } catch (e) {
                  console.warn('   ⚠️ Usage logging failed:', e?.message || e);
                }
              }
              
              return res.json(fallbackData);
            } catch (fallbackError) {
              const fallbackStatus = fallbackError?.response?.status || 500;
              const fallbackErrorData = fallbackError?.response?.data || {};
              console.error(`   ❌ Fallback also failed (${fallbackStatus}):`, {
                message: fallbackErrorData?.error?.message || fallbackErrorData?.message || fallbackError?.message,
                details: fallbackErrorData
              });
              
              // Always return a response when fallback fails
              if (!res.headersSent) {
                if (fallbackStatus === 401) {
                  console.log(`   📤 Returning 401 error response (fallback failed)`);
                  return res.status(401).json({ 
                    error: 'invalid_api_key', 
                    message: 'Both the dedicated API key and global token are invalid or expired. Please contact administrator.',
                    details: errorData
                  });
                }
                // Return error for other status codes
                console.log(`   📤 Returning ${fallbackStatus || 500} error response (fallback failed)`);
                return res.status(fallbackStatus || 500).json({ 
                  error: 'provider_error', 
                  message: fallbackErrorData?.error?.message || fallbackErrorData?.message || fallbackError?.message || 'Fallback request failed',
                  details: fallbackErrorData
                });
              }
              // If headers already sent, just return (should not happen, but safety check)
              console.warn(`   ⚠️ Headers already sent, cannot return response`);
              return;
            }
          } else {
            // This should not happen if logic is correct, but log for debugging
            console.log(`   ℹ️ Fallback not attempted: token=${token ? token.substring(0, 8) + '...' : 'null'}, keyId=${keyId}, hasGlobalToken=${!!OPENROUTER_TOKEN}, useKeyMatchesGlobal=${useKey && OPENROUTER_TOKEN && useKey === OPENROUTER_TOKEN}`);
          }
          
          // Only return if headers not already sent (fallback may have already returned)
          if (!res.headersSent) {
            console.log(`   📤 Returning 401 error response (no fallback or fallback not attempted)`);
            return res.status(401).json({ 
              error: 'invalid_api_key', 
              message: 'The API key is invalid or expired. Please check your API key or contact administrator.',
              details: errorData
            });
          } else {
            console.warn(`   ⚠️ Headers already sent, cannot return response (no fallback or fallback not attempted)`);
          }
        }
        console.log(`   📤 Returning 401 error response (authentication failed)`);
        return res.status(401).json({ 
          error: 'authentication_failed', 
          message: 'Authentication failed with the provider.',
          details: errorData
        });
      }
      
      console.log(`   📤 Returning ${status} error response (provider error)`);
      return res.status(status).json({ 
        error: 'provider_error', 
        message: errorMessage,
        details: errorData 
      });
    }
  };

  // POST /api/v1/chat/completions
  app.post('/api/v1/chat/completions', async (req, res) => {
    try {
      console.log('📥 POST /api/v1/chat/completions - Request received');
      console.log('   Auth header:', req.headers.authorization ? 'Present' : 'Missing');
      console.log('   Body:', JSON.stringify(req.body || {}).substring(0, 200));
      return await forwardToOpenRouter(req, res, 'https://openrouter.ai/api/v1/chat/completions');
    } catch (error) {
      console.error('❌ Unexpected error in /api/v1/chat/completions:', error);
      // Ensure we always return valid JSON
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'internal_server_error', 
          message: 'An unexpected error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  });

  // POST /api/v1/images/generations
  app.post('/api/v1/images/generations', async (req, res) => {
    try {
      console.log('📥 POST /api/v1/images/generations - Request received');
      return await forwardToOpenRouter(req, res, 'https://openrouter.ai/api/v1/images');
    } catch (error) {
      console.error('❌ Unexpected error in /api/v1/images/generations:', error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'internal_server_error', 
          message: 'An unexpected error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  });

  // POST /api/v1/embeddings - Embeddings endpoint for n8n and Dify
  app.post('/api/v1/embeddings', async (req, res) => {
    try {
      console.log('📥 POST /api/v1/embeddings - Request received');
      console.log('   Auth header:', req.headers.authorization ? 'Present' : 'Missing');
      console.log('   Body:', JSON.stringify(req.body || {}).substring(0, 200));
      return await forwardToOpenRouter(req, res, 'https://openrouter.ai/api/v1/embeddings');
    } catch (error) {
      console.error('❌ Unexpected error in /api/v1/embeddings:', error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'internal_server_error', 
          message: 'An unexpected error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  });

  // GET /api/v1/embeddings - Info endpoint for n8n connection testing
  app.get('/api/v1/embeddings', (_req, res) => {
    res.json({
      endpoint: '/api/v1/embeddings',
      method: 'POST',
      description: 'Text embeddings endpoint - Use POST method to create embeddings',
      supported_models: [
        'openai/text-embedding-3-small',
        'openai/text-embedding-3-large',
        'openai/text-embedding-ada-002',
        'cohere/embed-english-v3.0',
        'cohere/embed-multilingual-v3.0',
        'cohere/embed-english-light-v3.0',
        'cohere/embed-multilingual-light-v3.0',
        'voyageai/voyage-large-2',
        'voyageai/voyage-code-2',
        'nomic-ai/nomic-embed-text-v1.5',
        'jinaai/jina-embeddings-v2-base-en',
        'jinaai/jina-embeddings-v2-base-zh',
        'togethercomputer/m2-bert-80M-8k-retrieval',
        'togethercomputer/m2-bert-80M-32k-retrieval',
        'intfloat/multilingual-e5-large',
        'intfloat/multilingual-e5-base',
        'BAAI/bge-large-en-v1.5',
        'BAAI/bge-base-en-v1.5',
        'BAAI/bge-small-en-v1.5',
        'sentence-transformers/all-MiniLM-L6-v2',
        'sentence-transformers/all-mpnet-base-v2'
      ],
      example_request: {
        method: 'POST',
        url: '/api/v1/embeddings',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'openai/text-embedding-3-small',
          input: 'Text to embed'
        }
      }
    });
  });

  // GET /api/chatbot/usage - Get user credit/usage info for chatbot (n8n)
  // This endpoint allows n8n to query user credit/usage by email
  app.get('/api/chatbot/usage', async (req, res) => {
    const { userEmail } = req.query || {};
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' });
    }
    
    const client = await pool.connect();
    try {
      // Find user by email
      const userResult = await client.query(
        'SELECT id, email, fullname FROM users WHERE email = $1',
        [userEmail]
      );
      
      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Get all API keys for this user
      const keysResult = await client.query(`
        SELECT id, name, credit_limit, is_active, created_at
        FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [user.id]);
      
      const keys = keysResult.rows;
      
      // Detect available columns for compatibility
      let hasKeyId = false, hasCostUsd = false;
      try {
        const cols = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name='api_usage_logs'
        `);
        const names = cols.rows.map(x => x.column_name);
        hasKeyId = names.includes('key_id');
        hasCostUsd = names.includes('cost_usd');
      } catch (colError) {
        console.warn('GET /api/chatbot/usage: Could not detect columns:', colError?.message || colError);
      }
      
      // Calculate total usage across all keys
      let totalUsed = 0;
      let totalLimit = 0;
      const keysWithUsage = [];
      
      for (const key of keys) {
        const keyId = key.id;
        const creditLimit = Number(key.credit_limit || 0);
        totalLimit += creditLimit;
        
        // Get usage for this key with proper column detection
        let used = 0;
        try {
          const keyClause = hasKeyId ? "(api_key_id::text = $1::text OR key_id::text = $1::text)" : '(api_key_id::text = $1::text)';
          const costColumn = hasCostUsd ? 'cost_usd' : 'cost';
          
          const usageQuery = await client.query(`
            SELECT COALESCE(SUM(${costColumn}), 0) as total_used
            FROM api_usage_logs
            WHERE ${keyClause}
          `, [String(keyId)]);
          
          used = Number(usageQuery.rows[0]?.total_used || 0);
        } catch (usageError) {
          console.warn(`GET /api/chatbot/usage: Error querying usage for key ${keyId}:`, usageError?.message || usageError);
          used = 0;
        }
        
        totalUsed += used;
        
        keysWithUsage.push({
          id: key.id,
          name: key.name,
          credit_limit: creditLimit,
          used: used,
          remaining: creditLimit - used,
          is_active: key.is_active
        });
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname
        },
        summary: {
          total_limit: totalLimit,
          total_used: totalUsed,
          remaining: totalLimit - totalUsed,
          keys_count: keys.length
        },
        keys: keysWithUsage
      });
    } catch (error) {
      console.error('GET /api/chatbot/usage error:', error?.message || error);
      console.error('Stack:', error?.stack);
      res.status(500).json({ 
        error: 'failed_to_query_usage',
        message: error?.message || 'Internal server error'
      });
    } finally {
      client.release();
    }
  });

  // Shared handler for /api/v1/models and /v1/models (for n8n compatibility)
  const handleModelsEndpoint = async (req, res) => {
    try {
      // Check if we should fetch directly from OpenRouter (force refresh or cache empty)
      const forceDirect = req.query.direct === 'true' || req.query.refresh === 'true';
      const cacheAge = Date.now() - modelsCache.ts;
      const isCacheStale = !modelsCache.data || modelsCache.data.length === 0 || cacheAge > MODELS_CACHE_MS;
      
      // If cache is empty/stale or force direct, fetch from OpenRouter directly
      if (forceDirect || isCacheStale) {
        console.log(`🔄 [v1/models] ${forceDirect ? 'Force' : 'Cache stale/empty'}, fetching directly from OpenRouter...`);
        
        try {
          const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: {
              Authorization: `Bearer ${OPENROUTER_TOKEN}`,
              'HTTP-Referer': process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
              'X-Title': 'UBU AI SERVICE',
              'Accept': 'application/json'
            },
            timeout: 60000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          
          const directModels = Array.isArray(response.data?.data) ? response.data.data : [];
          console.log(`✅ [v1/models] Direct fetch: ${directModels.length} models from OpenRouter`);
          
          // Update cache with fresh data
          if (directModels.length > 0) {
            modelsCache.data = directModels;
            modelsCache.ts = Date.now();
          }
          
          // Use the directly fetched models
          if (directModels.length > 0) {
            const modelIds = directModels.map(m => m.id);
            
            // Format response in OpenAI format
            const openaiFormat = {
              object: 'list',
              data: modelIds.map(id => ({
                id: id,
                object: 'model',
                created: Math.floor(Date.now() / 1000),
                owned_by: 'ubu-ai-gateway'
              }))
            };
            
            console.log(`📋 [v1/models] Returning ${modelIds.length} models in OpenAI format (direct fetch)`);
            return res.json(openaiFormat);
          }
        } catch (directError) {
          console.error(`❌ [v1/models] Direct fetch failed:`, directError?.message);
          // Fall through to use cache or fallback
        }
      }
      
      // Try to get models from OpenRouter cache
      let modelIds = [];
      
      if (modelsCache.data && modelsCache.data.length > 0) {
        // Use ALL cached models from OpenRouter (no limit) - should be ~617 models
        modelIds = modelsCache.data.map(m => m.id);
        
        console.log(`📋 [v1/models] Using ${modelIds.length} models from cache`);
        
        // Always add embedding models even if OpenRouter doesn't provide them
        // These are commonly used embedding models that should be available
        const embeddingModels = [
          'openai/text-embedding-3-small',
          'openai/text-embedding-3-large',
          'openai/text-embedding-ada-002',
          'cohere/embed-english-v3.0',
          'cohere/embed-multilingual-v3.0',
          'cohere/embed-english-light-v3.0',
          'cohere/embed-multilingual-light-v3.0',
          'voyageai/voyage-large-2',
          'voyageai/voyage-code-2',
          'nomic-ai/nomic-embed-text-v1.5',
          'jinaai/jina-embeddings-v2-base-en',
          'jinaai/jina-embeddings-v2-base-zh',
          'togethercomputer/m2-bert-80M-8k-retrieval',
          'togethercomputer/m2-bert-80M-32k-retrieval',
          'intfloat/multilingual-e5-large',
          'intfloat/multilingual-e5-base',
          'BAAI/bge-large-en-v1.5',
          'BAAI/bge-base-en-v1.5',
          'BAAI/bge-small-en-v1.5',
          'sentence-transformers/all-MiniLM-L6-v2',
          'sentence-transformers/all-mpnet-base-v2'
        ];
        
        // Add embedding models that are not already in the list
        let addedEmbeddings = 0;
        embeddingModels.forEach(embedId => {
          if (!modelIds.includes(embedId)) {
            modelIds.push(embedId);
            addedEmbeddings++;
          }
        });
        
        if (addedEmbeddings > 0) {
          console.log(`📋 [v1/models] Added ${addedEmbeddings} embedding models from fallback list`);
        }
        
        // Log model count (no warning for lower counts)
        if (modelIds.length >= 600) {
          console.log(`✅ [v1/models] ${modelIds.length} models available (target: ~617)`);
        }
      } else {
        // Fallback: Use popular models that Gateway supports (including free models)
        modelIds = [
          // Free models
          'google/gemini-flash-1.5-8b',
          'google/gemini-flash-1.5',
          'meta-llama/llama-3.2-3b-instruct:free',
          'meta-llama/llama-3.1-8b-instruct:free',
          'mistralai/mistral-7b-instruct:free',
          'qwen/qwen-2.5-7b-instruct:free',
          'huggingface/zephyr-7b-beta:free',
          'openchat/openchat-7b:free',
          'undi95/toppy-m-7b:free',
          'gryphe/mythomist-7b:free',
          
          // Paid models - GPT
          'gpt-4o-mini',
          'gpt-4o',
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          
          // Paid models - Google Gemini
          'google/gemini-2.0-flash-exp',
          'google/gemini-2.5-flash',
          'google/gemini-pro',
          'google/gemini-pro-1.5',
          'google/gemini-flash-1.5-8b',
          'google/gemini-flash-1.5',
          
          // Paid models - Anthropic Claude
          'anthropic/claude-3.5-sonnet',
          'anthropic/claude-3-opus',
          'anthropic/claude-3-haiku',
          'anthropic/claude-3-5-sonnet-20241022',
          
          // Paid models - Meta Llama
          'meta-llama/llama-3.1-405b-instruct',
          'meta-llama/llama-3.1-70b-instruct',
          'meta-llama/llama-3.1-8b-instruct',
          'meta-llama/llama-3.2-3b-instruct',
          'meta-llama/llama-3.2-1b-instruct',
          
          // Paid models - Mistral
          'mistralai/mistral-large',
          'mistralai/mixtral-8x7b-instruct',
          'mistralai/mistral-7b-instruct',
          'mistralai/pixtral-12b',
          
          // Paid models - Perplexity
          'perplexity/llama-3.1-sonar-large-128k-online',
          'perplexity/llama-3.1-sonar-small-128k-online',
          'perplexity/llama-3.1-sonar-huge-128k-online',
          
          // Paid models - Qwen
          'qwen/qwen-2.5-72b-instruct',
          'qwen/qwen-2.5-32b-instruct',
          'qwen/qwen-2.5-14b-instruct',
          'qwen/qwen-2.5-7b-instruct',
          'qwen/qwen-2.5-1.5b-instruct',
          
          // Other popular models
          'deepseek/deepseek-chat',
          'deepseek/deepseek-coder',
          '01-ai/yi-1.5-34b-chat',
          '01-ai/yi-1.5-9b-chat',
          '01-ai/yi-1.5-6b-chat',
          'cohere/command-r-plus',
          'cohere/command-r',
          'x-ai/grok-beta',
          'x-ai/grok-2-1212',
          'google/palm-2-chat-bison',
          'openai/gpt-4-vision-preview',
          'anthropic/claude-2',
          'anthropic/claude-instant-1.2',
          
          // Embedding models
          'openai/text-embedding-3-small',
          'openai/text-embedding-3-large',
          'openai/text-embedding-ada-002',
          'cohere/embed-english-v3.0',
          'cohere/embed-multilingual-v3.0',
          'cohere/embed-english-light-v3.0',
          'cohere/embed-multilingual-light-v3.0',
          'voyageai/voyage-large-2',
          'voyageai/voyage-code-2',
          'nomic-ai/nomic-embed-text-v1.5',
          'jinaai/jina-embeddings-v2-base-en',
          'jinaai/jina-embeddings-v2-base-zh',
          'togethercomputer/m2-bert-80M-8k-retrieval',
          'togethercomputer/m2-bert-80M-32k-retrieval',
          'intfloat/multilingual-e5-large',
          'intfloat/multilingual-e5-base',
          'BAAI/bge-large-en-v1.5',
          'BAAI/bge-base-en-v1.5',
          'BAAI/bge-small-en-v1.5',
          'sentence-transformers/all-MiniLM-L6-v2',
          'sentence-transformers/all-mpnet-base-v2'
        ];
      }
      
      // Format response in OpenAI format
      const baseTimestamp = 1677610602; // Base timestamp for all models
      const response = {
        object: 'list',
        data: modelIds.map((id, index) => ({
          id: id,
          object: 'model',
          created: baseTimestamp + index, // Slight variation per model
          owned_by: 'ubu-ai-gateway'
        }))
      };
      
      const finalCount = response.data.length;
      console.log(`📋 [v1/models] Returning ${finalCount} models in OpenAI format`);
      
      if (finalCount >= 600) {
        console.log(`✅ [v1/models] Successfully returning ${finalCount} models (target: ~617)`);
      }
      
      return res.json(response);
    } catch (e) {
      console.error('❌ [v1/models] Error:', e?.message || e);
      // Return fallback models even on error (including free models and embeddings)
      const fallbackModels = [
        'google/gemini-flash-1.5-8b', // Free
        'meta-llama/llama-3.2-3b-instruct:free', // Free
        'gpt-4o-mini',
        'google/gemini-2.5-flash',
        'anthropic/claude-3.5-sonnet',
        'openai/text-embedding-3-small', // Embedding
        'openai/text-embedding-3-large', // Embedding
        'cohere/embed-english-v3.0' // Embedding
      ];
      return res.json({
        object: 'list',
        data: fallbackModels.map((id, index) => ({
          id: id,
          object: 'model',
          created: 1677610602 + index,
          owned_by: 'ubu-ai-gateway'
        }))
      });
    }
  };

  // GET /api/v1/models - OpenAI format for n8n compatibility
  app.get('/api/v1/models', handleModelsEndpoint);
  
  // GET /v1/models - Alternative path for n8n when Base URL is set to /ai_gateway_api
  app.get('/v1/models', handleModelsEndpoint);

  console.log('   📍 POST /api/v1/chat/completions');
  console.log('   📍 POST /api/v1/images/generations');
  console.log('   📍 POST /api/v1/embeddings');
  console.log('   📍 GET /api/v1/embeddings (info endpoint)');
  console.log('   📍 GET /api/v1/models');
  console.log('   📍 GET /v1/models (n8n compatibility)');
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
  
  // Initial models cache load
  console.log('📋 Loading initial models cache...');
  try {
    await refreshModelsCache();
    const initialCount = modelsCache.data ? modelsCache.data.length : 0;
    if (initialCount > 0) {
      console.log(`✅ Initial models cache loaded: ${initialCount} models`);
      if (initialCount >= 600) {
        console.log(`🎉 Successfully loaded ${initialCount} models (target: ~617)`);
      }
      const embeddingCount = modelsCache.data.filter(m => {
        const id = String(m.id || '').toLowerCase();
        return id.includes('embedding') || id.includes('embed-') || id.includes('voyage') || 
               id.includes('nomic-embed') || id.includes('jina-embeddings') || id.includes('bge-') ||
               id.includes('multilingual-e5') || id.includes('e5-') || id.includes('all-minilm') ||
               id.includes('all-mpnet') || id.includes('m2-bert') || id.includes('sentence-transformers') ||
               id.includes('cohere-embed') || id.includes('gte-') || id.includes('thenlper');
      }).length;
      console.log(`📊 Including ${embeddingCount} embedding models in initial cache (expected: ~22)`);
    } else {
      console.warn('⚠️ Initial models cache is empty. Check OPENROUTER_TOKEN and OpenRouter API connectivity.');
    }
  } catch (err) {
    console.error('❌ Initial models cache load failed:', err?.message || err);
    console.error('   Stack:', err?.stack);
  }
  
  // Schedule weekly models refresh (every 7 days) to catch new models
  const refreshIntervalDays = MODELS_AUTO_REFRESH_MS / (24 * 60 * 60 * 1000);
  console.log(`⏰ Scheduling weekly models refresh (every ${refreshIntervalDays} days)...`);
  console.log(`   Next automatic refresh will occur in ${refreshIntervalDays} days`);
  
  const weeklyRefreshInterval = setInterval(async () => {
    const now = new Date();
    console.log(`\n🔄 [${now.toISOString()}] Starting scheduled weekly models refresh...`);
    try {
      await refreshModelsCache();
      const count = modelsCache.data ? modelsCache.data.length : 0;
      console.log(`✅ [${now.toISOString()}] Weekly refresh completed: ${count} models cached`);
      if (count >= 600) {
        console.log(`🎉 Weekly refresh successful: ${count} models (target: ~617)`);
      }
    } catch (err) {
      console.error(`❌ [${now.toISOString()}] Weekly models refresh failed:`, err?.message || err);
    }
  }, MODELS_AUTO_REFRESH_MS);
  
  // Store interval ID for potential cleanup (optional)
  global.modelsRefreshInterval = weeklyRefreshInterval;
  
  console.log('🚀 ===========================================');
  console.log('🚀 UBU AI Gateway Backend Started');
  console.log('🚀 ===========================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📋 API Endpoints:');
  console.log(`   🔐 Auth: http://localhost:${PORT}/api/oauth-login`);
  console.log(`   👤 Me: http://localhost:${PORT}/api/me`);
  console.log(`   💰 My Usage: http://localhost:${PORT}/api/me/usage`);
  console.log(`   🔑 Keys: http://localhost:${PORT}/api/keys`);
  console.log(`   📊 Usage: http://localhost:${PORT}/api/keys/usage`);
  console.log('');
  console.log('🤖 AI Gateway (OpenAI Compatible):');
  console.log(`   💬 Chat: http://localhost:${PORT}/api/v1/chat/completions`);
  console.log(`   🖼️  Images: http://localhost:${PORT}/api/v1/images/generations`);
  console.log(`   📝 Embeddings: http://localhost:${PORT}/api/v1/embeddings`);
  console.log(`   📋 Models: http://localhost:${PORT}/api/v1/models`);
  console.log('');
  console.log('🤖 Chatbot:');
  console.log(`   💬 Usage: http://localhost:${PORT}/api/chatbot/usage`);
  console.log('');
  console.log('🌉 Gateway:');
  console.log(`   🔄 Gateway: http://localhost:${PORT}/gateway/:provider/:action`);
  console.log('🚀 ===========================================');
});


