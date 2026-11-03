'use strict';
const { db, config, sha256, randomToken, verifyPassword } = require('./core');
const { HttpError } = require('./http');

const COOKIE = 'vsid';

function setSessionCookie(res, token, maxAgeSec) {
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSec}`];
  if (config.cookieSecure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

async function createSession(res, userId) {
  const token = randomToken(32);
  const days = config.sessionDays;
  await db.query(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [sha256(token), userId, String(days)]);
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
  setSessionCookie(res, token, days * 86400);
}

async function destroySession(req, res) {
  const token = req.cookies[COOKIE];
  if (token) await db.query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]);
  setSessionCookie(res, '', 0);
}

// Charge l'utilisateur de la session (sans imposer la connexion)
async function loadUser(req) {
  req.user = null;
  const token = req.cookies[COOKIE];
  if (!token || token.length > 100) return;
  const u = await db.one(
    `SELECT u.id, u.role, u.email, u.phone, u.first_name, u.last_name, u.active, u.must_change_password
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`, [sha256(token)]);
  if (u && u.active) req.user = u;
}

const requireAuth = (...roles) => (req) => {
  if (!req.user) throw new HttpError(401, 'Veuillez vous connecter');
  if (roles.length && !roles.includes(req.user.role)) throw new HttpError(403, 'Accès réservé');
};

// Limiteur de tentatives (mémoire) : 10 essais / 15 min par clé
const attempts = new Map();
function rateLimit(key, max = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const a = attempts.get(key) || { n: 0, reset: now + windowMs };
  if (now > a.reset) { a.n = 0; a.reset = now + windowMs; }
  a.n += 1;
  attempts.set(key, a);
  if (a.n > max) throw new HttpError(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
}
setInterval(() => { const now = Date.now(); for (const [k, a] of attempts) if (now > a.reset) attempts.delete(k); }, 60000).unref();

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
}

async function checkLogin(email, password) {
  const u = await db.one('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  if (!u || !u.active || !verifyPassword(password, u.password_hash)) return null;
  return u;
}

const publicUser = (u) => u && ({
  id: u.id, role: u.role, email: u.email, phone: u.phone, first_name: u.first_name, last_name: u.last_name,
  must_change_password: u.must_change_password,
});

module.exports = { createSession, destroySession, loadUser, requireAuth, rateLimit, clientIp, checkLogin, publicUser };
