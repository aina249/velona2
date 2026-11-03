'use strict';
const { db, v, todayLocal, mondayOf, addDays } = require('../lib/core');
const { HttpError } = require('../lib/http');
const { requireAuth } = require('../lib/auth');
const { getSettings, savePhoto, FORMULAS } = require('../lib/domain');
const { availableSlots } = require('./public');
const { notify } = require('../lib/mailer');

const client = requireAuth('client');

const PROFILE_TEXT = ['sex', 'nationality', 'quartier', 'address', 'occupation', 'activity_level', 'follow_channel', 'family_status',
  'who_cooks', 'food_budget', 'reason', 'condition_other', 'medication', 'allergies', 'forbidden_foods', 'forbidden_reason',
  'expectations', 'goals', 'meal_interest', 'source'];
const CONDITIONS = ['diabete', 'hypertension', 'surpoids', 'digestif', 'grossesse', 'cholesterol', 'anemie', 'autre'];
const HABIT_KEYS = ['staples', 'drinks', 'alcohol', 'tobacco', 'sleep', 'stress', 'sport', 'sport_detail',
  'breakfast', 'breakfast_time', 'snack_am', 'snack_am_time', 'lunch', 'lunch_time', 'snack_pm', 'snack_pm_time', 'dinner', 'dinner_time'];

// Nettoie la partie « patient » de la fiche de renseignements (partagée avec le cockpit)
function cleanProfile(b) {
  const out = {};
  for (const k of PROFILE_TEXT) if (b[k] !== undefined) out[k] = v.str(b[k], k, { max: k === 'address' ? 300 : 1000 });
  if (b.birth_date !== undefined) out.birth_date = v.date(b.birth_date, 'date de naissance');
  if (b.household_size !== undefined) out.household_size = v.int(b.household_size, 'personnes au foyer', { min: 1, max: 30 });
  if (b.conditions !== undefined) out.conditions = v.list(b.conditions, 'antécédents', CONDITIONS);
  if (b.habits !== undefined) {
    if (typeof b.habits !== 'object' || b.habits === null || Array.isArray(b.habits)) throw new HttpError(400, 'Habitudes invalides');
    out.habits = {};
    for (const k of HABIT_KEYS) if (b.habits[k] !== undefined) out.habits[k] = v.str(b.habits[k], k, { max: 500 });
  }
  return out;
}
async function updateProfile(userId, data) {
  const keys = Object.keys(data);
  if (!keys.length) return;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  await db.query(`INSERT INTO client_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  await db.query(`UPDATE client_profiles SET ${sets}, updated_at = now() WHERE user_id = $1`, [userId, ...keys.map((k) => data[k])]);
}

async function activeProgram(clientId) {
  return db.one(`SELECT * FROM programs WHERE client_id = $1 AND status = 'actif' ORDER BY start_date DESC LIMIT 1`, [clientId]);
}

// Progression vers l'objectif (en %), à partir du dernier relevé
function progress(program, checkins) {
  if (!program || program.start_value === null || program.target_value === null) return null;
  const key = program.metric;
  const last = checkins.find((c) => c[key] !== null && c[key] !== undefined);
  const current = last ? parseFloat(last[key]) : parseFloat(program.start_value);
  const start = parseFloat(program.start_value);
  const target = parseFloat(program.target_value);
  if (start === target) return { current, pct: 100 };
  const pct = Math.max(0, Math.min(100, Math.round(((start - current) / (start - target)) * 100)));
  return { current, change: Math.round((current - start) * 10) / 10, pct };
}

async function menuWithMeals(clientId, weekStart) {
  const plan = await db.one('SELECT * FROM menu_plans WHERE client_id = $1 AND week_start = $2', [clientId, weekStart]);
  if (!plan) return { week_start: weekStart, items: [], note: null };
  const ids = [...new Set(plan.items.map((i) => i.meal_id).filter(Boolean))];
  const meals = ids.length ? await db.many('SELECT id, name, description, meal_type, tags FROM meals WHERE id = ANY($1::int[])', [ids]) : [];
  const byId = new Map(meals.map((m) => [m.id, m]));
  return { week_start: weekStart, note: plan.note, items: plan.items.map((i) => ({ ...i, meal: byId.get(i.meal_id) || null })) };
}

module.exports = (r) => {
  r.get('/api/me/dashboard', client, async (req) => {
    const id = req.user.id;
    const [program, checkins, nextAppt, sub, unread, pending, profile] = await Promise.all([
      activeProgram(id),
      db.many('SELECT id, created_at, weight, waist, energy, sleep, glucose FROM checkins WHERE client_id = $1 ORDER BY created_at DESC LIMIT 12', [id]),
      db.one(`SELECT * FROM appointments WHERE client_id = $1 AND status = 'confirme' AND starts_at > now() ORDER BY starts_at LIMIT 1`, [id]),
      db.one('SELECT * FROM meal_subscriptions WHERE client_id = $1', [id]),
      db.one('SELECT count(*)::int AS n FROM messages WHERE client_id = $1 AND sender_id IS DISTINCT FROM $1 AND read_at IS NULL', [id]),
      db.one(`SELECT count(*)::int AS n, coalesce(sum(amount_mga), 0)::int AS total FROM invoices WHERE client_id = $1 AND status = 'en_attente'`, [id]),
      db.one('SELECT checkin_fields, conditions FROM client_profiles WHERE user_id = $1', [id]),
    ]);
    const last = checkins[0];
    const daysSince = last ? Math.floor((Date.now() - new Date(last.created_at).getTime()) / 86400000) : null;
    const nextDelivery = sub && sub.status === 'actif'
      ? await db.one(`SELECT delivery_date, status, jsonb_array_length(items)::int AS count FROM meal_orders WHERE client_id = $1 AND delivery_date >= $2 ORDER BY delivery_date LIMIT 1`, [id, todayLocal()])
      : null;
    return {
      program, progress: progress(program, checkins), checkins: checkins.reverse(), next_appointment: nextAppt, subscription: sub,
      next_delivery: nextDelivery, unread_messages: unread.n, pending_invoices: pending,
      checkin_due: daysSince === null || daysSince >= 6, days_since_checkin: daysSince,
      checkin_fields: profile ? profile.checkin_fields : ['weight', 'waist', 'energy', 'sleep'],
    };
  });

  r.get('/api/me/profile', client, async (req) => {
    const p = await db.one('SELECT * FROM client_profiles WHERE user_id = $1', [req.user.id]);
    return { user: req.user, profile: p };
  });

  r.put('/api/me/profile', client, async (req) => {
    const b = req.body;
    if (b.phone !== undefined) await db.query('UPDATE users SET phone = $1 WHERE id = $2', [v.str(b.phone, 'téléphone', { required: true, max: 30 }), req.user.id]);
    await updateProfile(req.user.id, cleanProfile(b));
    return { ok: true };
  });

  // ---------- Check-ins ----------
  r.get('/api/me/checkins', client, async (req) => ({
    checkins: await db.many('SELECT * FROM checkins WHERE client_id = $1 ORDER BY created_at DESC LIMIT 100', [req.user.id]),
    program: await activeProgram(req.user.id),
  }));

  r.post('/api/me/checkins', client, async (req) => {
    const b = req.body;
    const recent = await db.one(`SELECT count(*)::int AS n FROM checkins WHERE client_id = $1 AND created_at > now() - interval '1 day'`, [req.user.id]);
    if (recent.n >= 3) throw new HttpError(429, 'Vous avez déjà envoyé plusieurs check-ins aujourd\'hui');
    const data = {
      weight: v.num(b.weight, 'poids', { min: 20, max: 350 }),
      waist: v.num(b.waist, 'tour de taille', { min: 30, max: 250 }),
      energy: v.int(b.energy, 'énergie', { min: 1, max: 5 }),
      sleep: v.oneOf(b.sleep, 'sommeil', ['faible', 'moyen', 'bon']),
      glucose: v.num(b.glucose, 'glycémie', { min: 0.2, max: 6 }),
      bp: v.str(b.bp, 'tension', { max: 20 }),
      note: v.str(b.note, 'commentaire', { max: 1000 }),
    };
    if (Object.values(data).every((x) => x === null) && !b.photo) throw new HttpError(400, 'Renseignez au moins une valeur');
    const photo = savePhoto(b.photo);
    return db.one(`INSERT INTO checkins (client_id, weight, waist, energy, sleep, glucose, bp, note, photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [req.user.id, data.weight, data.waist, data.energy, data.sleep, data.glucose, data.bp, data.note, photo]);
  });

  // ---------- Menus ----------
  r.get('/api/me/menu', client, async (req) => {
    const week = mondayOf(v.date(req.query.week, 'semaine') || todayLocal());
    return menuWithMeals(req.user.id, week);
  });

  // ---------- Repas livrés ----------
  r.get('/api/me/meals', client, async (req) => {
    const [sub, orders, settings] = await Promise.all([
      db.one('SELECT * FROM meal_subscriptions WHERE client_id = $1', [req.user.id]),
      db.many(`SELECT id, delivery_date, status, items FROM meal_orders WHERE client_id = $1 AND delivery_date >= $2::date - 14 ORDER BY delivery_date`, [req.user.id, todayLocal()]),
      getSettings(),
    ]);
    return { subscription: sub, orders, formulas: FORMULAS, prices: settings.prices, delivery: settings.delivery };
  });

  r.put('/api/me/meals', client, async (req) => {
    const b = req.body;
    const s = await getSettings();
    const formula = v.oneOf(b.formula, 'formule', Object.keys(FORMULAS), { required: true });
    const days = v.list(b.delivery_days, 'jours de livraison', s.delivery.days.length ? s.delivery.days : ['lundi', 'jeudi']);
    if (!days.length) throw new HttpError(400, 'Choisissez au moins un jour de livraison', { field: 'jours de livraison' });
    const address = v.str(b.address, 'adresse', { required: true, max: 300 });
    const quartier = v.str(b.quartier, 'quartier', { required: true, max: 100 });
    const instructions = v.str(b.instructions, 'instructions', { max: 500 });
    const status = v.oneOf(b.status, 'statut', ['actif', 'pause', 'arrete']) || 'actif';
    const row = await db.one(`INSERT INTO meal_subscriptions (client_id, formula, delivery_days, address, quartier, instructions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (client_id) DO UPDATE SET formula = $2, delivery_days = $3, address = $4, quartier = $5, instructions = $6, status = $7, updated_at = now()
      RETURNING *`, [req.user.id, formula, days, address, quartier, instructions, status]);
    return row;
  });

  // ---------- Rendez-vous ----------
  r.get('/api/me/appointments', client, async (req) => ({
    appointments: await db.many('SELECT * FROM appointments WHERE client_id = $1 ORDER BY starts_at DESC LIMIT 50', [req.user.id]),
    slots: await availableSlots(),
  }));

  r.post('/api/me/appointments', client, async (req) => {
    const b = req.body;
    const startsAt = v.str(b.starts_at, 'créneau', { required: true, max: 40 });
    const slots = await availableSlots();
    const slot = slots.find((s) => s.starts_at === new Date(startsAt).toISOString());
    if (!slot) throw new HttpError(409, 'Ce créneau n\'est plus disponible. Choisissez-en un autre.');
    const format = v.oneOf(b.format, 'format', ['cabinet', 'visio'], { required: true });
    const kind = v.oneOf(b.kind, 'type', ['bilan', 'suivi']) || 'bilan';
    const s = await getSettings();
    let appt;
    try {
      appt = await db.one(`INSERT INTO appointments (client_id, starts_at, duration_min, format, kind, client_note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, slot.starts_at, s.agenda.slot_minutes || 60, format, kind, v.str(b.note, 'note', { max: 1000 })]);
    } catch (e) {
      if (e.code === '23505') throw new HttpError(409, 'Ce créneau vient d\'être réservé. Choisissez-en un autre.');
      throw e;
    }
    const when = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Indian/Antananarivo', dateStyle: 'full', timeStyle: 'short' }).format(new Date(appt.starts_at));
    notify(req.user.email, 'Votre rendez-vous Vélona est confirmé', `Bonjour ${req.user.first_name},\n\nVotre ${kind === 'bilan' ? 'bilan nutritionnel' : 'consultation de suivi'} est confirmé le ${when} (${format === 'visio' ? 'en visio' : 'au cabinet'}).\n${format === 'cabinet' && s.cabinet.address ? 'Adresse : ' + s.cabinet.address + '\n' : ''}\nÀ bientôt,\nAnnick`);
    const admins = await db.many(`SELECT email FROM users WHERE role = 'admin' AND active`);
    for (const a of admins) notify(a.email, 'Nouveau rendez-vous', `${req.user.first_name} ${req.user.last_name} a réservé un ${kind} le ${when} (${format}).`);
    return appt;
  });

  r.post('/api/me/appointments/:id/cancel', client, async (req) => {
    const a = await db.one('SELECT * FROM appointments WHERE id = $1 AND client_id = $2', [v.id(req.params.id), req.user.id]);
    if (!a) throw new HttpError(404, 'Rendez-vous introuvable');
    if (a.status !== 'confirme') throw new HttpError(400, 'Ce rendez-vous ne peut plus être annulé');
    if (new Date(a.starts_at).getTime() - Date.now() < 12 * 3600000) throw new HttpError(400, 'Annulation possible jusqu\'à 12 h avant. Écrivez à Annick via la messagerie.');
    await db.query(`UPDATE appointments SET status = 'annule' WHERE id = $1`, [a.id]);
    return { ok: true };
  });

  // ---------- Messagerie ----------
  r.get('/api/me/messages', client, async (req) => {
    await db.query('UPDATE messages SET read_at = now() WHERE client_id = $1 AND sender_id IS DISTINCT FROM $1 AND read_at IS NULL', [req.user.id]);
    return { messages: await db.many(`SELECT m.*, (m.sender_id = $1) AS mine FROM messages m WHERE client_id = $1 ORDER BY created_at LIMIT 500`, [req.user.id]) };
  });

  r.post('/api/me/messages', client, async (req) => {
    const body = v.str(req.body.body, 'message', { required: !req.body.photo, max: 4000 }) || '';
    const photo = savePhoto(req.body.photo);
    const m = await db.one('INSERT INTO messages (client_id, sender_id, body, photo) VALUES ($1, $1, $2, $3) RETURNING *', [req.user.id, body, photo]);
    // Réponse automatique au premier message de la journée
    const s = await getSettings();
    const auto = await db.one(`SELECT id FROM messages WHERE client_id = $1 AND automatic AND created_at > now() - interval '1 day'`, [req.user.id]);
    if (!auto && s.messaging.auto_reply) {
      await db.query('INSERT INTO messages (client_id, sender_id, body, automatic) VALUES ($1, NULL, $2, true)', [req.user.id, s.messaging.auto_reply]);
    }
    return m;
  });

  // ---------- Factures ----------
  r.get('/api/me/invoices', client, async (req) => ({
    invoices: await db.many('SELECT * FROM invoices WHERE client_id = $1 ORDER BY issued_at DESC', [req.user.id]),
    payment: (await getSettings()).payment,
  }));

  r.post('/api/me/invoices/:id/declare', client, async (req) => {
    const method = v.oneOf(req.body.method, 'moyen de paiement', ['mvola', 'orange_money', 'airtel_money', 'especes', 'virement'], { required: true });
    const ref = v.str(req.body.ref, 'référence', { required: method !== 'especes', max: 100 });
    const inv = await db.one(`UPDATE invoices SET status = 'declaree', method = $1, payment_ref = $2, declared_at = now()
      WHERE id = $3 AND client_id = $4 AND status = 'en_attente' RETURNING *`, [method, ref, v.id(req.params.id), req.user.id]);
    if (!inv) throw new HttpError(400, 'Cette facture ne peut pas être déclarée payée');
    return inv;
  });

  r.get('/api/me/next-weeks', client, async () => {
    const ws = mondayOf(todayLocal());
    return { weeks: [addDays(ws, -7), ws, addDays(ws, 7)] };
  });
};

module.exports.cleanProfile = cleanProfile;
module.exports.updateProfile = updateProfile;
module.exports.progress = progress;
module.exports.menuWithMeals = menuWithMeals;
