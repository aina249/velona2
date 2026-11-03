'use strict';
// Petit routeur HTTP sans dépendance : routes avec paramètres, corps JSON, cookies,
// fichiers statiques avec repli SPA, en-têtes de sécurité.

const fs = require('fs');
const path = require('path');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    try { out[k] = decodeURIComponent(v); } catch (_) { out[k] = v; }
  }
  return out;
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

class Router {
  constructor() { this.routes = []; }
  add(method, pattern, ...handlers) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/\/:([a-zA-Z_]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
    this.routes.push({ method, re, keys, handlers });
  }
  get(p, ...h) { this.add('GET', p, ...h); }
  post(p, ...h) { this.add('POST', p, ...h); }
  put(p, ...h) { this.add('PUT', p, ...h); }
  delete(p, ...h) { this.add('DELETE', p, ...h); }
  match(method, pathname) {
    let pathMatched = false;
    for (const r of this.routes) {
      const m = pathname.match(r.re);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== method) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { route: r, params };
    }
    return pathMatched ? { methodNotAllowed: true } : null;
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'Requête trop volumineuse')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, data) {
  if (res.headersSent) return;
  const body = JSON.stringify(data === undefined ? {} : data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function serveStatic(req, res, root, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.includes('\0')) return false;
  let file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) return false;
  let stat;
  try { stat = fs.statSync(file); } catch (_) { stat = null; }
  if (!stat || stat.isDirectory()) {
    // Repli SPA : toute route sans extension renvoie index.html
    if (path.extname(rel)) return false;
    file = path.join(root, 'index.html');
    try { stat = fs.statSync(file); } catch (_) { return false; }
  }
  const ext = path.extname(file).toLowerCase();
  const isHtml = ext === '.html';
  const isSw = path.basename(file) === 'sw.js';
  const hashed = /-[A-Z0-9]{8}\.(js|css)$/i.test(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': isHtml || isSw ? 'no-cache' : hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(file).pipe(res);
  return true;
}

function createHandler({ router, staticRoot, bodyLimit = 6 * 1024 * 1024, onError, before }) {
  return async (req, res) => {
    securityHeaders(res);
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    req.query = Object.fromEntries(url.searchParams);
    req.cookies = parseCookies(req.headers.cookie);
    req.pathname = pathname;
    try {
      if (pathname.startsWith('/api/')) {
        const found = router.match(req.method, pathname);
        if (!found) throw new HttpError(404, 'Route introuvable');
        if (found.methodNotAllowed) throw new HttpError(405, 'Méthode non autorisée');
        req.params = found.params;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          // Protection CSRF : en-tête personnalisé obligatoire (non envoyable cross-site sans CORS)
          if (req.headers['x-velona'] !== '1') throw new HttpError(403, 'Requête refusée');
          const raw = await readBody(req, bodyLimit);
          if (raw.length) {
            try { req.body = JSON.parse(raw.toString('utf8')); } catch (_) { throw new HttpError(400, 'JSON invalide'); }
          } else req.body = {};
          if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) throw new HttpError(400, 'Corps de requête invalide');
        } else req.body = {};
        if (before) await before(req, res);
        for (const h of found.route.handlers) {
          const out = await h(req, res);
          if (res.writableEnded || res.headersSent) return;
          if (out !== undefined) return send(res, 200, out);
        }
        if (!res.headersSent) send(res, 200, { ok: true });
        return;
      }
      if ((req.method === 'GET' || req.method === 'HEAD') && staticRoot && serveStatic(req, res, staticRoot, pathname)) return;
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Page introuvable');
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message, details: err.details });
      if (onError) onError(err, req);
      send(res, 500, { error: 'Erreur interne du serveur' });
    }
  };
}

module.exports = { Router, HttpError, createHandler, send, parseCookies };
