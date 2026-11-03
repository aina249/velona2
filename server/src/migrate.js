'use strict';
// Applique les migrations SQL (dossier migrations/) dans l'ordre, une seule fois chacune.
const fs = require('fs');
const path = require('path');
const { db } = require('./lib/core');

async function migrate({ quiet = false } = {}) {
  const c = await db.pool.connect();
  try {
    await c.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const done = new Set((await c.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const f of files) {
      if (done.has(f)) continue;
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      await c.query('BEGIN');
      try {
        if (c.exec) await c.exec(sql); else await c.query(sql);
        await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
        await c.query('COMMIT');
        if (!quiet) console.log('Migration appliquée :', f);
      } catch (e) {
        await c.query('ROLLBACK');
        throw new Error(`Échec de la migration ${f} : ${e.message}`);
      }
    }
  } finally { c.release(); }
}

module.exports = { migrate };

if (require.main === module) {
  migrate().then(() => { console.log('Base à jour.'); return db.pool.end(); }).catch((e) => { console.error(e.message); process.exit(1); });
}
