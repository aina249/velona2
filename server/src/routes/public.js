'use strict';
const { db, v, config, hashPassword, verifyPassword, todayLocal, addDays } = require('../lib/core');
const { HttpError } = require('../lib/http');
const auth = require('../lib/auth');
const { getSettings } = require('../lib/domain');
const { notify } = require('../lib/mailer');

// Décalage horaire (minutes) d'un fuseau à un instant donné
function tzOffsetMin(tz, date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}
function localToUtc(dateStr, timeStr, tz) {
  const naive = new Date(`${dateStr}T${timeStr.slice(0, 5)}:00Z`);
  return new Date(naive.getTime() - tzOffsetMin(tz, naive) * 60000);
}

// Créneaux disponibles pour les prochains jours
async function availableSlots() {
  const s = await getSettings();
  const step = s.agenda.slot_minutes || 60;
  const rows = await db.many('SELECT weekday, start_time, end_time FROM availability ORDER BY weekday, start_time');
  const taken = new Set((await db.many(`SELECT starts_at FROM appointments WHERE status <> 'annule' AND starts_at > now()`)).map((r) => new Date(r.starts_at).getTime()));
  const minStart = Date.now() + (s.agenda.min_notice_hours || 12) * 3600000;
  const today = todayLocal();
  const out = [];
  for (let i = 0; i <= (s.agenda.days_ahead || 21); i++) {
    const date = addDays(today, i);
    const wd = new Date(date + 'T00:00:00Z').getUTCDay();
    for (const r of rows.filter((x) => x.weekday === wd)) {
      const [sh, sm] = r.start_time.split(':').map(Number);
      const [eh, em] = r.end_time.split(':').map(Number);
      for (let t = sh * 60 + sm; t + step <= eh * 60 + em; t += step) {
        const hhmm = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
        const at = localToUtc(date, hhmm, config.timezone);
        if (at.getTime() < minStart || taken.has(at.getTime())) continue;
        out.push({ date, time: hhmm, starts_at: at.toISOString() });
      }
    }
  }
  return out;
}

const VITALITY_QUESTIONS = 12;

module.exports = (r) => {
  r.post('/api/auth/register', async (req, res) => {
    auth.rateLimit('register:' + auth.clientIp(req), 10);
    const b = req.body;
    const first = v.str(b.first_name, 'prénom', { required: true, max: 80 });
    const last = v.str(b.last_name, 'nom', { required: true, max: 80 });
    const email = v.email(b.email);
    const phone = v.str(b.phone, 'téléphone', { required: true, max: 30 });
    const password = v.str(b.password, 'mot de passe', { required: true, min: 8, max: 200 });
    if (b.consent !== true) throw new HttpError(400, 'Votre accord est nécessaire pour créer le compte', { field: 'consentement' });
    const exists = await db.one('SELECT id FROM users WHERE lower(email) = $1', [email]);
    if (exists) throw new HttpError(409, 'Un compte existe déjà avec cet e-mail', { field: 'e-mail' });
    const user = await db.tx(async (t) => {
      const u = await t.one(`INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
        VALUES ('client', $1, $2, $3, $4, $5) RETURNING *`, [email, phone, hashPassword(password), first, last]);
      await t.query('INSERT INTO client_profiles (user_id, consent_at) VALUES ($1, now())', [u.id]);
      const testId = v.int(b.test_id, 'test', { min: 1 });
      if (testId) await t.query('UPDATE vitality_tests SET user_id = $1, converted = true WHERE id = $2 AND user_id IS NULL', [u.id, testId]);
      return u;
    });
    await auth.createSession(res, user.id);
    notify(email, 'Bienvenue chez Vélona', `Bonjour ${first},\n\nVotre espace Vélona est prêt. Vous pouvez dès maintenant réserver votre bilan et suivre vos progrès : ${config.appUrl}\n\nÀ très vite,\nAnnick`);
    return { user: auth.publicUser(user) };
  });

  r.post('/api/auth/login', async (req, res) => {
    const email = v.email(req.body.email);
    const password = v.str(req.body.password, 'mot de passe', { required: true, max: 200 });
    auth.rateLimit('login:' + auth.clientIp(req), 20);
    auth.rateLimit('login:' + email, 10);
    const u = await auth.checkLogin(email, password);
    if (!u) throw new HttpError(401, 'E-mail ou mot de passe incorrect');
    await auth.createSession(res, u.id);
    return { user: auth.publicUser(u) };
  });

  r.post('/api/auth/logout', async (req, res) => { await auth.destroySession(req, res); return { ok: true }; });

  r.get('/api/auth/me', async (req) => ({ user: auth.publicUser(req.user) }));

  r.post('/api/auth/password', auth.requireAuth(), async (req) => {
    const current = v.str(req.body.current, 'mot de passe actuel', { required: true, max: 200 });
    const next = v.str(req.body.next, 'nouveau mot de passe', { required: true, min: 8, max: 200 });
    const u = await db.one('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!verifyPassword(current, u.password_hash)) throw new HttpError(400, 'Mot de passe actuel incorrect', { field: 'mot de passe actuel' });
    await db.query('UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2', [hashPassword(next), req.user.id]);
    // Déconnecte les autres appareils
    await db.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> encode(sha256(convert_to($2, \'UTF8\')), \'hex\')', [req.user.id, req.cookies.vsid || '']);
    return { ok: true };
  });

  // Test de vitalité (public)
  r.post('/api/public/vitality', async (req) => {
    auth.rateLimit('vitality:' + auth.clientIp(req), 30, 60 * 60 * 1000);
    const answers = req.body.answers;
    if (!Array.isArray(answers) || answers.length !== VITALITY_QUESTIONS || !answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 3)) {
      throw new HttpError(400, 'Réponses invalides');
    }
    const score = Math.round(answers.reduce((s, a) => s + a, 0) / (VITALITY_QUESTIONS * 3) * 100);
    const row = await db.one(`INSERT INTO vitality_tests (user_id, first_name, contact, answers, score) VALUES ($1, $2, $3, $4, $5) RETURNING id, score`,
      [req.user ? req.user.id : null, v.str(req.body.first_name, 'prénom', { max: 80 }), v.str(req.body.contact, 'contact', { max: 120 }), JSON.stringify(answers), score]);
    return row;
  });

  r.post('/api/public/vitality/:id/contact', async (req) => {
    auth.rateLimit('vitality-contact:' + auth.clientIp(req), 20, 60 * 60 * 1000);
    const id = v.id(req.params.id);
    const first = v.str(req.body.first_name, 'prénom', { required: true, max: 80 });
    const contact = v.str(req.body.contact, 'contact', { required: true, max: 120 });
    await db.query('UPDATE vitality_tests SET first_name = $1, contact = $2 WHERE id = $3 AND created_at > now() - interval \'1 day\'', [first, contact, id]);
    return { ok: true };
  });

  r.get('/api/public/settings', async () => {
    const s = await getSettings();
    return { cabinet: s.cabinet, prices: s.prices, payment: s.payment, delivery: s.delivery };
  });

  r.get('/api/public/slots', async () => ({ slots: await availableSlots() }));
};

module.exports.availableSlots = availableSlots;
module.exports.localToUtc = localToUtc;
