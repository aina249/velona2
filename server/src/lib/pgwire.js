'use strict';
// Client PostgreSQL minimal, sans dépendance (protocole v3).
// Gère : authentification SCRAM-SHA-256 / MD5 / mot de passe, SSL optionnel,
// requêtes paramétrées (protocole étendu), requêtes multiples (protocole simple),
// pool de connexions. Interface compatible avec le paquet "pg" : query(text, params) -> { rows, rowCount }.

const net = require('net');
const tls = require('tls');
const crypto = require('crypto');

// ---------- Conversion des types (format texte) ----------
function parseArray(str, conv) {
  // Analyse un tableau PostgreSQL à une dimension : {a,b,"c d",NULL}
  if (str === '{}') return [];
  const out = [];
  let i = 1, cur = '', quoted = false, wasQuoted = false;
  while (i < str.length) {
    const ch = str[i];
    if (quoted) {
      if (ch === '\\') { cur += str[i + 1]; i += 2; continue; }
      if (ch === '"') { quoted = false; i++; continue; }
      cur += ch; i++; continue;
    }
    if (ch === '"') { quoted = true; wasQuoted = true; i++; continue; }
    if (ch === ',' || ch === '}') {
      if (!wasQuoted && cur === 'NULL') out.push(null);
      else out.push(conv ? conv(cur) : cur);
      cur = ''; wasQuoted = false; i++; continue;
    }
    cur += ch; i++;
  }
  return out;
}

const PARSERS = {
  16: (v) => v === 't',
  21: (v) => parseInt(v, 10),
  23: (v) => parseInt(v, 10),
  26: (v) => parseInt(v, 10),
  700: (v) => parseFloat(v),
  1700: (v) => parseFloat(v), // numeric -> nombre (valeurs de mesure)
  701: (v) => parseFloat(v),
  114: (v) => JSON.parse(v),
  3802: (v) => JSON.parse(v),
  1082: (v) => v, // date -> chaîne "YYYY-MM-DD"
  1083: (v) => v, // time -> chaîne
  1114: (v) => new Date(v.replace(' ', 'T') + 'Z'),
  1184: (v) => new Date(v.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00')),
  1000: (v) => parseArray(v, (x) => x === 't'),
  1005: (v) => parseArray(v, (x) => parseInt(x, 10)),
  1007: (v) => parseArray(v, (x) => parseInt(x, 10)),
  1009: (v) => parseArray(v),
  1021: (v) => parseArray(v, parseFloat),
  1022: (v) => parseArray(v, parseFloat),
  1231: (v) => parseArray(v, parseFloat),
  1015: (v) => parseArray(v),
};

function parseValue(oid, buf) {
  if (buf === null) return null;
  const s = buf.toString('utf8');
  const p = PARSERS[oid];
  return p ? p(s) : s;
}

function serialize(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (Buffer.isBuffer(v)) return '\\x' + v.toString('hex');
  if (Array.isArray(v)) {
    return '{' + v.map((x) => {
      if (x === null || x === undefined) return 'NULL';
      return '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }).join(',') + '}';
  }
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

// ---------- Écriture des messages ----------
function cstr(s) { return Buffer.concat([Buffer.from(s, 'utf8'), Buffer.from([0])]); }
function int16(n) { const b = Buffer.alloc(2); b.writeInt16BE(n); return b; }
function int32(n) { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; }
function msg(type, body) {
  const len = int32(body.length + 4);
  return type ? Buffer.concat([Buffer.from(type), len, body]) : Buffer.concat([len, body]);
}

class PgError extends Error {
  constructor(fields) {
    super(fields.M || 'Erreur PostgreSQL');
    this.code = fields.C;
    this.severity = fields.S;
    this.detail = fields.D;
    this.constraint = fields.n;
    this.table = fields.t;
    this.column = fields.c;
  }
}

class Client {
  constructor(cfg) {
    this.cfg = cfg;
    this.buf = Buffer.alloc(0);
    this.queue = [];
    this.current = null;
    this.ready = false;
    this.dead = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const { host = '127.0.0.1', port = 5432, ssl } = this.cfg;
      const sock = net.connect({ host, port });
      sock.setNoDelay(true);
      this._onConnectResolve = resolve;
      this._onConnectReject = reject;
      const onError = (err) => this._fail(err);
      sock.once('error', onError);
      sock.once('connect', () => {
        if (ssl) {
          // Demande SSL
          sock.write(Buffer.concat([int32(8), int32(80877103)]));
          sock.once('data', (d) => {
            if (d[0] !== 0x53) return this._fail(new Error('Le serveur PostgreSQL refuse SSL'));
            const opts = typeof ssl === 'object' ? ssl : {};
            const t = tls.connect({ socket: sock, servername: host, rejectUnauthorized: opts.rejectUnauthorized !== false, ca: opts.ca });
            t.once('error', onError);
            t.once('secureConnect', () => this._start(t));
          });
        } else {
          this._start(sock);
        }
      });
    });
  }

  _start(sock) {
    this.sock = sock;
    sock.on('data', (d) => this._onData(d));
    sock.on('error', (e) => this._fail(e));
    sock.on('close', () => this._fail(new Error('Connexion PostgreSQL fermée')));
    const params = Buffer.concat([
      cstr('user'), cstr(this.cfg.user),
      cstr('database'), cstr(this.cfg.database || this.cfg.user),
      cstr('client_encoding'), cstr('UTF8'),
      cstr('DateStyle'), cstr('ISO'),
      cstr('TimeZone'), cstr(this.cfg.timezone || 'UTC'),
      Buffer.from([0]),
    ]);
    sock.write(msg(null, Buffer.concat([int32(196608), params])));
  }

  _fail(err) {
    if (this.dead) return;
    this.dead = true;
    if (this._onConnectReject) { const r = this._onConnectReject; this._onConnectReject = null; r(err); }
    if (this.current) { this.current.reject(err); this.current = null; }
    for (const q of this.queue) q.reject(err);
    this.queue = [];
    if (this.onDead) this.onDead(err);
    try { this.sock && this.sock.destroy(); } catch (_) { /* ignore */ }
  }

  _onData(d) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    while (this.buf.length >= 5) {
      const type = String.fromCharCode(this.buf[0]);
      const len = this.buf.readInt32BE(1);
      if (this.buf.length < len + 1) break;
      const body = this.buf.subarray(5, len + 1);
      this.buf = this.buf.subarray(len + 1);
      try { this._handle(type, body); } catch (e) { this._fail(e); return; }
    }
  }

  _handle(type, body) {
    switch (type) {
      case 'R': return this._auth(body);
      case 'S': case 'K': case 'N': case 'A': return;
      case 'Z': {
        if (!this.ready) {
          this.ready = true;
          const r = this._onConnectResolve; this._onConnectResolve = null; this._onConnectReject = null;
          if (r) r(this);
          return;
        }
        const cur = this.current; this.current = null;
        if (cur) { if (cur.error) cur.reject(cur.error); else cur.resolve(cur.multi ? cur.results : cur.result); }
        this._next();
        return;
      }
      case 'E': {
        const fields = {};
        let i = 0;
        while (i < body.length && body[i] !== 0) {
          const code = String.fromCharCode(body[i]);
          const end = body.indexOf(0, i + 1);
          fields[code] = body.toString('utf8', i + 1, end);
          i = end + 1;
        }
        const err = new PgError(fields);
        if (!this.ready) return this._fail(err);
        if (this.current) this.current.error = this.current.error || err;
        return;
      }
      case 'T': {
        const n = body.readInt16BE(0);
        let i = 2; const fields = [];
        for (let k = 0; k < n; k++) {
          const end = body.indexOf(0, i);
          const name = body.toString('utf8', i, end);
          i = end + 1;
          const oid = body.readInt32BE(i + 6);
          i += 18;
          fields.push({ name, oid });
        }
        const r = { rows: [], fields, rowCount: 0 };
        if (this.current.multi) this.current.results.push(r);
        this.current.result = r;
        return;
      }
      case 'D': {
        const r = this.current.result;
        const n = body.readInt16BE(0);
        let i = 2; const row = {};
        for (let k = 0; k < n; k++) {
          const len = body.readInt32BE(i); i += 4;
          let v = null;
          if (len >= 0) { v = body.subarray(i, i + len); i += len; }
          const f = r.fields[k];
          row[f.name] = parseValue(f.oid, v);
        }
        r.rows.push(row);
        return;
      }
      case 'C': {
        const tag = body.toString('utf8', 0, body.length - 1);
        const m = tag.match(/(\d+)$/);
        if (!this.current.result) {
          this.current.result = { rows: [], fields: [], rowCount: 0 };
          if (this.current.multi) this.current.results.push(this.current.result);
        }
        this.current.result.rowCount = m ? parseInt(m[1], 10) : 0;
        this.current.result.command = tag.split(' ')[0];
        if (this.current.multi) this.current.result = null;
        return;
      }
      case '1': case '2': case 'n': case 'I': case 's': case '3':
        return;
      default:
        return;
    }
  }

  _auth(body) {
    const code = body.readInt32BE(0);
    const { user, password = '' } = this.cfg;
    if (code === 0) return;
    if (code === 3) { this.sock.write(msg('p', cstr(password))); return; }
    if (code === 5) {
      const salt = body.subarray(4, 8);
      const inner = crypto.createHash('md5').update(password + user).digest('hex');
      const outer = crypto.createHash('md5').update(Buffer.concat([Buffer.from(inner), salt])).digest('hex');
      this.sock.write(msg('p', cstr('md5' + outer)));
      return;
    }
    if (code === 10) {
      const mechs = body.toString('utf8', 4).split('\0');
      if (!mechs.includes('SCRAM-SHA-256')) throw new Error('Mécanisme SASL non pris en charge');
      this.nonce = crypto.randomBytes(18).toString('base64');
      this.firstBare = 'n=*,r=' + this.nonce;
      const first = Buffer.from('n,,' + this.firstBare);
      this.sock.write(msg('p', Buffer.concat([cstr('SCRAM-SHA-256'), int32(first.length), first])));
      return;
    }
    if (code === 11) {
      const serverFirst = body.toString('utf8', 4);
      const attrs = Object.fromEntries(serverFirst.split(',').map((p) => [p[0], p.slice(2)]));
      if (!attrs.r.startsWith(this.nonce)) throw new Error('Nonce SCRAM invalide');
      const salted = crypto.pbkdf2Sync(password.normalize('NFKC'), Buffer.from(attrs.s, 'base64'), parseInt(attrs.i, 10), 32, 'sha256');
      const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
      const clientKey = hmac(salted, 'Client Key');
      const storedKey = crypto.createHash('sha256').update(clientKey).digest();
      const withoutProof = 'c=biws,r=' + attrs.r;
      const authMessage = this.firstBare + ',' + serverFirst + ',' + withoutProof;
      const sig = hmac(storedKey, authMessage);
      const proof = Buffer.alloc(clientKey.length);
      for (let i = 0; i < proof.length; i++) proof[i] = clientKey[i] ^ sig[i];
      this.serverSig = hmac(hmac(salted, 'Server Key'), authMessage).toString('base64');
      this.sock.write(msg('p', Buffer.from(withoutProof + ',p=' + proof.toString('base64'))));
      return;
    }
    if (code === 12) {
      const v = body.toString('utf8', 4).split(',').find((p) => p.startsWith('v='));
      if (!v || v.slice(2) !== this.serverSig) throw new Error('Signature serveur SCRAM invalide');
      return;
    }
    throw new Error('Méthode d\'authentification PostgreSQL non prise en charge : ' + code);
  }

  query(text, params) {
    return new Promise((resolve, reject) => {
      if (this.dead) return reject(new Error('Connexion PostgreSQL indisponible'));
      this.queue.push({ text, params, resolve, reject });
      if (!this.current) this._next();
    });
  }

  // Exécute plusieurs instructions SQL (migrations) via le protocole simple.
  exec(text) {
    return new Promise((resolve, reject) => {
      if (this.dead) return reject(new Error('Connexion PostgreSQL indisponible'));
      this.queue.push({ text, simple: true, resolve, reject });
      if (!this.current) this._next();
    });
  }

  _next() {
    if (this.current || !this.queue.length || this.dead) return;
    const q = this.queue.shift();
    this.current = q;
    if (q.simple) {
      q.multi = true; q.results = [];
      this.sock.write(msg('Q', cstr(q.text)));
      return;
    }
    q.result = null;
    const params = (q.params || []).map(serialize);
    const parse = msg('P', Buffer.concat([cstr(''), cstr(q.text), int16(0)]));
    const parts = [cstr(''), cstr(''), int16(0), int16(params.length)];
    for (const p of params) {
      if (p === null) parts.push(int32(-1));
      else { const b = Buffer.from(p, 'utf8'); parts.push(int32(b.length), b); }
    }
    parts.push(int16(0));
    const bind = msg('B', Buffer.concat(parts));
    const describe = msg('D', Buffer.concat([Buffer.from('P'), cstr('')]));
    const execute = msg('E', Buffer.concat([cstr(''), int32(0)]));
    const sync = msg('S', Buffer.alloc(0));
    const origResolve = q.resolve;
    q.resolve = (r) => origResolve(r || { rows: [], fields: [], rowCount: 0 });
    this.sock.write(Buffer.concat([parse, bind, describe, execute, sync]));
  }

  end() {
    if (this.dead) return;
    try { this.sock.write(msg('X', Buffer.alloc(0))); } catch (_) { /* ignore */ }
    this.dead = true;
    try { this.sock.end(); } catch (_) { /* ignore */ }
  }
}

function parseUrl(url) {
  const u = new URL(url);
  const ssl = u.searchParams.get('sslmode');
  return {
    host: u.hostname || '127.0.0.1',
    port: u.port ? parseInt(u.port, 10) : 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    ssl: ssl && ssl !== 'disable' ? { rejectUnauthorized: ssl === 'verify-full' } : false,
  };
}

class Pool {
  constructor(cfg) {
    this.cfg = typeof cfg.connectionString === 'string' ? { ...parseUrl(cfg.connectionString), ...cfg } : cfg;
    this.max = this.cfg.max || 10;
    this.idle = [];
    this.all = new Set();
    this.waiting = [];
  }

  async _create() {
    const c = new Client(this.cfg);
    this.all.add(c);
    c.onDead = () => { this.all.delete(c); this.idle = this.idle.filter((x) => x !== c); };
    try { await c.connect(); } catch (e) { this.all.delete(c); throw e; }
    return c;
  }

  async connect() {
    const c = this.idle.pop();
    if (c && !c.dead) return this._wrap(c);
    if (this.all.size < this.max) return this._wrap(await this._create());
    return new Promise((resolve, reject) => this.waiting.push({ resolve, reject }));
  }

  _wrap(c) {
    let released = false;
    return {
      query: (t, p) => c.query(t, p),
      exec: (t) => c.exec(t),
      release: (destroy) => {
        if (released) return;
        released = true;
        if (destroy || c.dead) { c.end(); this.all.delete(c); }
        const w = this.waiting.shift();
        if (w) {
          if (!c.dead && !destroy) return w.resolve(this._wrap(c));
          return this.connect().then(w.resolve, w.reject);
        }
        if (!c.dead && !destroy) this.idle.push(c);
      },
    };
  }

  async query(text, params) {
    const c = await this.connect();
    try { return await c.query(text, params); }
    finally { c.release(); }
  }

  async end() {
    for (const c of this.all) c.end();
    this.all.clear(); this.idle = [];
  }
}

module.exports = { Pool, Client, PgError, parseUrl, _parseArray: parseArray };
