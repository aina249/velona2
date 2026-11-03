'use strict';
const http = require('http');
const { config, db } = require('./lib/core');
const { Router, createHandler } = require('./lib/http');
const { loadUser } = require('./lib/auth');
const { migrate } = require('./migrate');
const { sendMail } = require('./lib/mailer');

const router = new Router();
require('./routes/public')(router);
require('./routes/client')(router);
require('./routes/admin')(router);
require('./routes/kitchen')(router);
router.get('/api/health', async () => { await db.query('SELECT 1'); return { ok: true }; });

const handler = createHandler({
  router,
  staticRoot: config.publicDir,
  before: loadUser,
  onError: (err, req) => console.error(`[${new Date().toISOString()}] ${req.method} ${req.pathname}`, err),
});

// Rappels automatiques (toutes les heures) : check-in hebdomadaire et rendez-vous du lendemain
async function reminders() {
  const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: config.timezone, dateStyle: 'full', timeStyle: 'short' });
  const appts = await db.many(`UPDATE appointments a SET reminder_sent = true FROM users u
    WHERE u.id = a.client_id AND a.status = 'confirme' AND NOT a.reminder_sent AND a.starts_at BETWEEN now() + interval '12 hours' AND now() + interval '30 hours'
    RETURNING a.starts_at, a.format, u.email, u.first_name`);
  for (const a of appts) {
    await sendMail(a.email, 'Rappel : votre rendez-vous Vélona', `Bonjour ${a.first_name},\n\nPetit rappel : rendez-vous le ${fmt.format(new Date(a.starts_at))} (${a.format === 'visio' ? 'en visio' : 'au cabinet'}).\n\nÀ bientôt,\nAnnick`);
  }
  const due = await db.many(`UPDATE client_profiles cp SET last_reminder_at = now() FROM users u
    WHERE u.id = cp.user_id AND u.active
      AND EXISTS (SELECT 1 FROM programs p WHERE p.client_id = u.id AND p.status = 'actif')
      AND coalesce((SELECT max(created_at) FROM checkins c WHERE c.client_id = u.id), '-infinity') < now() - interval '7 days'
      AND coalesce(cp.last_reminder_at, '-infinity') < now() - interval '6 days'
    RETURNING u.email, u.first_name`);
  for (const c of due) {
    await sendMail(c.email, 'C\'est l\'heure de votre check-in', `Bonjour ${c.first_name},\n\nVotre check-in de la semaine vous attend : 2 minutes pour noter vos mesures et votre ressenti.\n${config.appUrl}/app/checkin\n\nAnnick`);
  }
}

async function start() {
  await migrate();
  const server = http.createServer(handler);
  server.headersTimeout = 30000;
  server.requestTimeout = 60000;
  server.listen(config.port, () => console.log(`Vélona prêt sur http://localhost:${config.port}`));
  const tick = () => reminders().catch((e) => console.error('[rappels]', e.message));
  setTimeout(tick, 60000).unref();
  setInterval(tick, 3600000).unref();
  const stop = () => server.close(() => db.pool.end().then(() => process.exit(0)));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  return server;
}

if (require.main === module) start().catch((e) => { console.error(e.message); process.exit(1); });

module.exports = { handler, start, reminders };
