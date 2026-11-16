'use strict';
// Configuration, base de données, validation, sécurité des mots de passe et utilitaires de dates.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { HttpError } = require('./http');

// ---------- Configuration (.env facultatif) ----------
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv(path.join(__dirname, '..', '..', '.env'));

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgres://velona:velona@127.0.0.1:5432/velona',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  uploadsDir: path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads')),
  publicDir: path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, '..', '..', 'public')),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  smtpUrl: process.env.SMTP_URL || '',
  mailFrom: process.env.MAIL_FROM || 'Vélona <no-reply@velona.mg>',
  timezone: process.env.APP_TIMEZONE || 'Indian/Antananarivo',
  sessionDays: 30,
  oauth: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    },
    facebook: {
      appId: process.env.FACEBOOK_OAUTH_APP_ID || '',
      appSecret: process.env.FACEBOOK_OAUTH_APP_SECRET || '',
      graphVersion: process.env.FACEBOOK_GRAPH_VERSION || 'v27.0',
    },
  },
};

// ---------- Base de données ----------
let PoolImpl;
try { PoolImpl = require('pg').Pool; } catch (_) { PoolImpl = require('./pgwire').Pool; }
const pool = new PoolImpl({ connectionString: config.databaseUrl, max: 10 });
if (PoolImpl !== require('./pgwire').Pool) {
  // Aligne le paquet "pg" (s'il est installé) sur le comportement du client intégré.
  const types = require('pg').types;
  types.setTypeParser(1082, (v) => v);
  types.setTypeParser(1700, (v) => parseFloat(v));
}

const db = {
  pool,
  async query(text, params) { return pool.query(text, params); },
  async one(text, params) { const r = await pool.query(text, params); return r.rows[0] || null; },
  async many(text, params) { const r = await pool.query(text, params); return r.rows; },
  async tx(fn) {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      const helper = {
        query: (t, p) => c.query(t, p),
        one: async (t, p) => (await c.query(t, p)).rows[0] || null,
        many: async (t, p) => (await c.query(t, p)).rows,
      };
      const out = await fn(helper);
      await c.query('COMMIT');
      return out;
    } catch (e) {
      try { await c.query('ROLLBACK'); } catch (_) { /* ignore */ }
      throw e;
    } finally { c.release(); }
  },
};

// ---------- Validation ----------
const bad = (field, msg) => { throw new HttpError(400, msg, { field }); };
const v = {
  str(x, field, { required = false, max = 500, min = 0 } = {}) {
    if (x === undefined || x === null || (typeof x === 'string' && x.trim() === '')) {
      if (required) bad(field, `Le champ « ${field} » est obligatoire`);
      return null;
    }
    if (typeof x !== 'string' && typeof x !== 'number') bad(field, `Le champ « ${field} » est invalide`);
    const s = String(x).trim();
    if (s.length > max) bad(field, `Le champ « ${field} » est trop long (${max} caractères maximum)`);
    if (s.length < min) bad(field, `Le champ « ${field} » est trop court (${min} caractères minimum)`);
    return s;
  },
  num(x, field, { required = false, min = -Infinity, max = Infinity } = {}) {
    if (x === undefined || x === null || x === '') { if (required) bad(field, `Le champ « ${field} » est obligatoire`); return null; }
    const n = typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) bad(field, `Le champ « ${field} » doit être un nombre entre ${min} et ${max}`);
    return n;
  },
  int(x, field, opts = {}) {
    const n = v.num(x, field, opts);
    if (n === null) return null;
    if (!Number.isInteger(n)) bad(field, `Le champ « ${field} » doit être un nombre entier`);
    return n;
  },
  oneOf(x, field, list, { required = false } = {}) {
    if (x === undefined || x === null || x === '') { if (required) bad(field, `Le champ « ${field} » est obligatoire`); return null; }
    if (!list.includes(x)) bad(field, `Valeur invalide pour « ${field} »`);
    return x;
  },
  date(x, field, { required = false } = {}) {
    if (!x) { if (required) bad(field, `Le champ « ${field} » est obligatoire`); return null; }
    if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x) || isNaN(Date.parse(x + 'T00:00:00Z'))) bad(field, `Date invalide pour « ${field} »`);
    return x;
  },
  email(x, field = 'e-mail', { required = true } = {}) {
    const s = v.str(x, field, { required, max: 200 });
    if (s === null) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) bad(field, 'Adresse e-mail invalide');
    return s.toLowerCase();
  },
  list(x, field, allowed, { max = 20 } = {}) {
    if (x === undefined || x === null) return [];
    if (!Array.isArray(x) || x.length > max) bad(field, `Liste invalide pour « ${field} »`);
    return x.map((i) => {
      if (allowed && !allowed.includes(i)) bad(field, `Valeur invalide dans « ${field} »`);
      if (typeof i !== 'string' || i.length > 100) bad(field, `Valeur invalide dans « ${field} »`);
      return i;
    });
  },
  bool(x) { return x === true || x === 'true'; },
  id(x, field = 'id') { return v.int(x, field, { required: true, min: 1, max: 2147483647 }); },
};

// ---------- Mots de passe et jetons ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored || '').split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const got = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(expected, got);
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randomToken = (n = 32) => crypto.randomBytes(n).toString('base64url');
function tempPassword() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const b = crypto.randomBytes(10);
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join('');
}

// ---------- Dates (fuseau Madagascar) ----------
function todayLocal(tz = config.timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const wd = (d.getUTCDay() + 6) % 7; // 0 = lundi
  return addDays(dateStr, -wd);
}
const WEEKDAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

module.exports = {
  config, db, v, bad, hashPassword, verifyPassword, sha256, randomToken, tempPassword,
  todayLocal, addDays, mondayOf, WEEKDAYS_FR,
};
