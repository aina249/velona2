'use strict';
const { db, v, hashPassword, tempPassword, todayLocal, mondayOf, addDays } = require('../lib/core');
const { HttpError } = require('../lib/http');
const { requireAuth } = require('../lib/auth');
const { getSettings, saveSettings, computeAlerts, createInvoice, savePhoto, FORMULAS, SLOT_LABELS } = require('../lib/domain');
const { cleanProfile, updateProfile, progress, menuWithMeals } = require('./client');
const { notify } = require('../lib/mailer');
const { localToUtc } = require('./public');
const { config } = require('../lib/core');

const admin = requireAuth('admin');
const SLOTS = Object.keys(SLOT_LABELS);
const fullName = (u) => `${u.first_name} ${u.last_name}`.trim();

const CONSULT_NUM = { weight: [20, 350], height: [40, 250], waist: [30, 250], hip: [30, 250], fat_pct: [1, 80] };
const CONSULT_TEXT = ['bp', 'muac', 'glucose', 'albumin', 'cholesterol', 'triglycerides', 'hemoglobin', 'other_tests', 'observations',
  'assessment', 'conclusion', 'program_prescribed', 'meals_prescribed', 'fee', 'internal_notes'];
function cleanConsultation(b) {
  const out = {};
  for (const [k, [min, max]] of Object.entries(CONSULT_NUM)) if (b[k] !== undefined) out[k] = v.num(b[k], k, { min, max });
  for (const k of CONSULT_TEXT) if (b[k] !== undefined) out[k] = v.str(b[k], k, { max: 4000 });
  if (b.hr !== undefined) out.hr = v.int(b.hr, 'fréquence cardiaque', { min: 20, max: 250 });
  for (const k of ['consulted_at', 'bio_date', 'next_appointment']) if (b[k] !== undefined) out[k] = v.date(b[k], k);
  if (b.peds !== undefined) {
    const p = b.peds || {};
    out.peds = { weight_age: v.str(p.weight_age, 'P/A', { max: 50 }), height_age: v.str(p.height_age, 'T/A', { max: 50 }), muac_age: v.str(p.muac_age, 'PB/A', { max: 50 }) };
  }
  if (b.appointment_id !== undefined) out.appointment_id = v.int(b.appointment_id, 'rendez-vous', { min: 1 });
  return out;
}

async function clientExists(id) {
  const u = await db.one(`SELECT * FROM users WHERE id = $1 AND role = 'client'`, [id]);
  if (!u) throw new HttpError(404, 'Client introuvable');
  return u;
}

module.exports = (r) => {
  // ---------- Tableau de bord ----------
  r.get('/api/admin/dashboard', admin, async () => {
    const today = todayLocal();
    const ws = mondayOf(today);
    const monthStart = today.slice(0, 8) + '01';
    const [active, checkinsWeek, mealsWeek, revenueMonth, revenueSeries, appts, tomorrow, unread, unreviewed, leads, alerts] = await Promise.all([
      db.one(`SELECT count(DISTINCT client_id)::int AS n FROM programs WHERE status = 'actif'`),
      db.one(`SELECT count(DISTINCT c.client_id)::int AS received,
                (SELECT count(DISTINCT client_id)::int FROM programs WHERE status = 'actif') AS expected
                FROM checkins c JOIN programs p ON p.client_id = c.client_id AND p.status = 'actif'
               WHERE c.created_at >= $1::date`, [ws]),
      db.one(`SELECT coalesce(sum(jsonb_array_length(items)), 0)::int AS n FROM meal_orders WHERE delivery_date BETWEEN $1 AND $2`, [ws, addDays(ws, 6)]),
      db.one(`SELECT coalesce(sum(amount_mga), 0)::int AS n FROM invoices WHERE status = 'payee' AND paid_at >= $1::date`, [monthStart]),
      db.many(`SELECT to_char(date_trunc('month', paid_at AT TIME ZONE 'Indian/Antananarivo'), 'YYYY-MM') AS month, sum(amount_mga)::int AS total
                 FROM invoices WHERE status = 'payee' AND paid_at >= (date_trunc('month', now()) - interval '5 months')
                GROUP BY 1 ORDER BY 1`),
      db.many(`SELECT a.*, u.first_name, u.last_name, u.phone FROM appointments a JOIN users u ON u.id = a.client_id
                WHERE a.status = 'confirme' AND a.starts_at >= $1::date AND a.starts_at < $1::date + 8 ORDER BY a.starts_at`, [today]),
      db.many(`SELECT quartier, status, count(*)::int AS orders, sum(jsonb_array_length(items))::int AS meals
                 FROM meal_orders WHERE delivery_date = $1 GROUP BY quartier, status ORDER BY quartier`, [addDays(today, 1)]),
      db.one(`SELECT count(*)::int AS n FROM messages m WHERE m.sender_id = m.client_id AND m.read_at IS NULL`),
      db.one(`SELECT count(*)::int AS n FROM checkins WHERE reviewed_at IS NULL`),
      db.one(`SELECT count(*)::int AS n FROM vitality_tests WHERE created_at > now() - interval '7 days'`),
      computeAlerts(),
    ]);
    // Complète la série des 6 derniers mois (mois sans revenu = 0)
    const months = [];
    const d = new Date(today + 'T00:00:00Z');
    for (let i = 5; i >= 0; i--) {
      const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)).toISOString().slice(0, 7);
      months.push({ month: m, total: (revenueSeries.find((x) => x.month === m) || {}).total || 0 });
    }
    return {
      kpis: { active_clients: active.n, checkins_received: checkinsWeek.received, checkins_expected: checkinsWeek.expected,
        meals_week: mealsWeek.n, revenue_month: revenueMonth.n, unread_messages: unread.n, unreviewed_checkins: unreviewed.n, new_leads: leads.n },
      revenue: months, appointments: appts, tomorrow_deliveries: { date: addDays(today, 1), rows: tomorrow }, alerts,
    };
  });

  // ---------- Clients ----------
  r.get('/api/admin/clients', admin, async (req) => {
    const q = v.str(req.query.q, 'recherche', { max: 100 });
    const rows = await db.many(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.active, u.created_at, cp.quartier, cp.birth_date,
             p.kind AS program_kind, p.metric, p.start_value, p.target_value, p.start_date, p.end_date,
             (SELECT max(created_at) FROM checkins c WHERE c.client_id = u.id) AS last_checkin,
             (SELECT row_to_json(c) FROM (SELECT weight, waist, glucose FROM checkins WHERE client_id = u.id ORDER BY created_at DESC LIMIT 1) c) AS last_values,
             (SELECT count(*)::int FROM invoices i WHERE i.client_id = u.id AND i.status IN ('en_attente', 'declaree')) AS unpaid,
             ms.formula, ms.status AS meal_status
        FROM users u
        LEFT JOIN client_profiles cp ON cp.user_id = u.id
        LEFT JOIN LATERAL (SELECT * FROM programs WHERE client_id = u.id AND status = 'actif' ORDER BY start_date DESC LIMIT 1) p ON true
        LEFT JOIN meal_subscriptions ms ON ms.client_id = u.id
       WHERE u.role = 'client' AND ($1::text IS NULL OR (u.first_name || ' ' || u.last_name || ' ' || u.email || ' ' || coalesce(u.phone, '')) ILIKE '%' || $1 || '%')
       ORDER BY u.active DESC, u.last_name, u.first_name`, [q]);
    return {
      clients: rows.map((c) => {
        const days = c.last_checkin ? Math.floor((Date.now() - new Date(c.last_checkin).getTime()) / 86400000) : null;
        const prog = c.program_kind ? { metric: c.metric, start_value: c.start_value, target_value: c.target_value } : null;
        const pr = prog ? progress(prog, c.last_values ? [c.last_values] : []) : null;
        return { ...c, days_since_checkin: days, progress: pr ? pr.pct : null,
          checkin_status: !c.program_kind ? 'sans_programme' : days === null || days >= 10 ? 'a_relancer' : days >= 7 ? 'en_retard' : 'a_jour' };
      }),
    };
  });

  r.post('/api/admin/clients', admin, async (req) => {
    const b = req.body;
    const email = v.email(b.email);
    if (await db.one('SELECT id FROM users WHERE lower(email) = $1', [email])) throw new HttpError(409, 'Un compte existe déjà avec cet e-mail', { field: 'e-mail' });
    const pwd = tempPassword();
    const u = await db.tx(async (t) => {
      const user = await t.one(`INSERT INTO users (role, email, phone, password_hash, first_name, last_name, must_change_password)
        VALUES ('client', $1, $2, $3, $4, $5, true) RETURNING *`,
      [email, v.str(b.phone, 'téléphone', { max: 30 }), hashPassword(pwd), v.str(b.first_name, 'prénom', { required: true, max: 80 }), v.str(b.last_name, 'nom', { required: true, max: 80 })]);
      await t.query('INSERT INTO client_profiles (user_id, consent_at) VALUES ($1, CASE WHEN $2 THEN now() END)', [user.id, b.consent === true]);
      return user;
    });
    return { id: u.id, temp_password: pwd };
  });

  r.get('/api/admin/clients/:id', admin, async (req) => {
    const id = v.id(req.params.id);
    const u = await clientExists(id);
    const [profile, consultations, programs, checkins, sub, invoices, appointments, tests] = await Promise.all([
      db.one('SELECT * FROM client_profiles WHERE user_id = $1', [id]),
      db.many('SELECT * FROM consultations WHERE client_id = $1 ORDER BY consulted_at DESC, id DESC', [id]),
      db.many('SELECT * FROM programs WHERE client_id = $1 ORDER BY start_date DESC', [id]),
      db.many('SELECT * FROM checkins WHERE client_id = $1 ORDER BY created_at DESC LIMIT 200', [id]),
      db.one('SELECT * FROM meal_subscriptions WHERE client_id = $1', [id]),
      db.many('SELECT * FROM invoices WHERE client_id = $1 ORDER BY issued_at DESC', [id]),
      db.many('SELECT * FROM appointments WHERE client_id = $1 ORDER BY starts_at DESC', [id]),
      db.many('SELECT id, score, answers, created_at FROM vitality_tests WHERE user_id = $1 ORDER BY created_at DESC', [id]),
    ]);
    const active = programs.find((p) => p.status === 'actif') || null;
    return {
      user: { id: u.id, email: u.email, phone: u.phone, first_name: u.first_name, last_name: u.last_name, active: u.active, created_at: u.created_at, last_login_at: u.last_login_at },
      profile, consultations, programs, active_program: active, progress: progress(active, checkins), checkins, subscription: sub, invoices, appointments, tests,
    };
  });

  r.put('/api/admin/clients/:id', admin, async (req) => {
    const id = v.id(req.params.id);
    const u = await clientExists(id);
    const b = req.body;
    const email = b.email !== undefined ? v.email(b.email) : u.email;
    if (email !== u.email && await db.one('SELECT id FROM users WHERE lower(email) = $1 AND id <> $2', [email, id])) throw new HttpError(409, 'E-mail déjà utilisé');
    await db.query('UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, active = $5 WHERE id = $6', [
      b.first_name !== undefined ? v.str(b.first_name, 'prénom', { required: true, max: 80 }) : u.first_name,
      b.last_name !== undefined ? v.str(b.last_name, 'nom', { required: true, max: 80 }) || '' : u.last_name,
      email, b.phone !== undefined ? v.str(b.phone, 'téléphone', { max: 30 }) : u.phone,
      b.active !== undefined ? v.bool(b.active) : u.active, id]);
    if (b.active === false) await db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    const profile = cleanProfile(b.profile || {});
    if (b.checkin_fields !== undefined) profile.checkin_fields = v.list(b.checkin_fields, 'champs du check-in', ['weight', 'waist', 'energy', 'sleep', 'glucose', 'bp']);
    await updateProfile(id, profile);
    return { ok: true };
  });

  r.post('/api/admin/clients/:id/reset-password', admin, async (req) => {
    const id = v.id(req.params.id);
    await clientExists(id);
    const pwd = tempPassword();
    await db.query('UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2', [hashPassword(pwd), id]);
    await db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    return { temp_password: pwd };
  });

  // ---------- Consultations (fiche praticien) ----------
  r.post('/api/admin/clients/:id/consultations', admin, async (req) => {
    const id = v.id(req.params.id);
    await clientExists(id);
    const data = cleanConsultation(req.body);
    const keys = Object.keys(data);
    const row = await db.one(`INSERT INTO consultations (client_id, created_by${keys.map((k) => ', ' + k).join('')})
      VALUES ($1, $2${keys.map((_, i) => ', $' + (i + 3)).join('')}) RETURNING *`, [id, req.user.id, ...keys.map((k) => data[k])]);
    if (data.appointment_id) await db.query(`UPDATE appointments SET status = 'termine' WHERE id = $1 AND client_id = $2`, [data.appointment_id, id]);
    return row;
  });

  r.put('/api/admin/consultations/:id', admin, async (req) => {
    const id = v.id(req.params.id);
    const data = cleanConsultation(req.body);
    const keys = Object.keys(data);
    if (!keys.length) return { ok: true };
    const row = await db.one(`UPDATE consultations SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...keys.map((k) => data[k])]);
    if (!row) throw new HttpError(404, 'Consultation introuvable');
    return row;
  });

  // ---------- Programmes ----------
  r.post('/api/admin/clients/:id/programs', admin, async (req) => {
    const id = v.id(req.params.id);
    const u = await clientExists(id);
    const b = req.body;
    const kind = v.oneOf(b.kind, 'durée', ['30', '60', '90'], { required: true });
    const start = v.date(b.start_date, 'date de début') || todayLocal();
    const data = {
      goal_label: v.str(b.goal_label, 'objectif', { required: true, max: 200 }),
      metric: v.oneOf(b.metric, 'indicateur', ['weight', 'waist', 'glucose']) || 'weight',
      start_value: v.num(b.start_value, 'valeur de départ', { min: 0, max: 400 }),
      target_value: v.num(b.target_value, 'valeur cible', { min: 0, max: 400 }),
    };
    const amount = v.int(b.invoice_amount, 'montant', { min: 0, max: 100000000 });
    const result = await db.tx(async (t) => {
      await t.query(`UPDATE programs SET status = 'termine' WHERE client_id = $1 AND status = 'actif'`, [id]);
      const p = await t.one(`INSERT INTO programs (client_id, kind, start_date, end_date, goal_label, metric, start_value, target_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [id, kind, start, addDays(start, parseInt(kind, 10) - 1), data.goal_label, data.metric, data.start_value, data.target_value]);
      let invoice = null;
      if (amount) invoice = await createInvoice(t, { client_id: id, label: `Programme ${kind} jours`, items: [{ label: `Programme ${kind} jours`, amount_mga: amount }], amount_mga: amount });
      return { program: p, invoice };
    });
    if (result.invoice) notify(u.email, `Votre facture ${result.invoice.number}`, `Bonjour ${u.first_name},\n\nVotre programme ${kind} jours commence le ${start.split('-').reverse().join('/')}.\nFacture ${result.invoice.number} : ${amount.toLocaleString('fr-FR')} MGA, à régler depuis votre espace Vélona.\n\nAnnick`);
    return result;
  });

  r.put('/api/admin/programs/:id', admin, async (req) => {
    const id = v.id(req.params.id);
    const b = req.body;
    const p = await db.one('SELECT * FROM programs WHERE id = $1', [id]);
    if (!p) throw new HttpError(404, 'Programme introuvable');
    const row = await db.one(`UPDATE programs SET goal_label = $1, metric = $2, start_value = $3, target_value = $4, status = $5, end_date = $6 WHERE id = $7 RETURNING *`, [
      b.goal_label !== undefined ? v.str(b.goal_label, 'objectif', { required: true, max: 200 }) : p.goal_label,
      b.metric !== undefined ? v.oneOf(b.metric, 'indicateur', ['weight', 'waist', 'glucose'], { required: true }) : p.metric,
      b.start_value !== undefined ? v.num(b.start_value, 'valeur de départ', { min: 0, max: 400 }) : p.start_value,
      b.target_value !== undefined ? v.num(b.target_value, 'valeur cible', { min: 0, max: 400 }) : p.target_value,
      b.status !== undefined ? v.oneOf(b.status, 'statut', ['actif', 'termine', 'pause', 'annule'], { required: true }) : p.status,
      b.end_date !== undefined ? v.date(b.end_date, 'date de fin', { required: true }) : p.end_date, id]);
    return row;
  });

  // ---------- Check-ins ----------
  r.get('/api/admin/checkins', admin, async (req) => ({
    checkins: await db.many(`SELECT c.*, u.first_name, u.last_name FROM checkins c JOIN users u ON u.id = c.client_id
      WHERE ($1::boolean IS NOT TRUE OR c.reviewed_at IS NULL) ORDER BY c.created_at DESC LIMIT 200`, [req.query.unreviewed === '1']),
  }));

  r.post('/api/admin/checkins/:id/review', admin, async (req) => {
    const note = v.str(req.body.note, 'commentaire', { max: 2000 });
    const c = await db.one('UPDATE checkins SET reviewed_at = now(), review_note = $1 WHERE id = $2 RETURNING *', [note, v.id(req.params.id)]);
    if (!c) throw new HttpError(404, 'Check-in introuvable');
    if (note && req.body.send_message !== false) {
      await db.query('INSERT INTO messages (client_id, sender_id, body) VALUES ($1, $2, $3)', [c.client_id, req.user.id, note]);
    }
    return c;
  });

  // ---------- Bibliothèque de repas ----------
  function cleanMeal(b) {
    const ingredients = Array.isArray(b.ingredients) ? b.ingredients.slice(0, 40).map((i, k) => ({
      name: v.str(i && i.name, `ingrédient ${k + 1}`, { required: true, max: 100 }),
      qty: v.num(i && i.qty, `quantité ${k + 1}`, { min: 0, max: 100000 }) || 0,
      unit: v.str(i && i.unit, `unité ${k + 1}`, { max: 20 }) || '',
    })) : [];
    return {
      name: v.str(b.name, 'nom', { required: true, max: 150 }),
      description: v.str(b.description, 'description', { max: 1000 }),
      meal_type: v.oneOf(b.meal_type, 'type de repas', SLOTS, { required: true }),
      tags: v.list(b.tags, 'étiquettes'),
      profiles: v.list(b.profiles, 'profils'),
      ingredients,
      active: b.active === undefined ? true : v.bool(b.active),
    };
  }
  r.get('/api/admin/meals', admin, async () => ({ meals: await db.many('SELECT * FROM meals ORDER BY active DESC, meal_type, name') }));
  r.post('/api/admin/meals', admin, async (req) => {
    const m = cleanMeal(req.body);
    return db.one(`INSERT INTO meals (name, description, meal_type, tags, profiles, ingredients, active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [m.name, m.description, m.meal_type, m.tags, m.profiles, JSON.stringify(m.ingredients), m.active]);
  });
  r.put('/api/admin/meals/:id', admin, async (req) => {
    const m = cleanMeal(req.body);
    const row = await db.one(`UPDATE meals SET name = $1, description = $2, meal_type = $3, tags = $4, profiles = $5, ingredients = $6, active = $7 WHERE id = $8 RETURNING *`,
      [m.name, m.description, m.meal_type, m.tags, m.profiles, JSON.stringify(m.ingredients), m.active, v.id(req.params.id)]);
    if (!row) throw new HttpError(404, 'Repas introuvable');
    return row;
  });

  // ---------- Menus par client ----------
  r.get('/api/admin/clients/:id/menu', admin, async (req) => {
    const id = v.id(req.params.id);
    await clientExists(id);
    const week = mondayOf(v.date(req.query.week, 'semaine') || todayLocal());
    return menuWithMeals(id, week);
  });
  r.put('/api/admin/clients/:id/menu', admin, async (req) => {
    const id = v.id(req.params.id);
    await clientExists(id);
    const week = mondayOf(v.date(req.body.week_start, 'semaine', { required: true }));
    if (!Array.isArray(req.body.items) || req.body.items.length > 60) throw new HttpError(400, 'Menu invalide');
    const seen = new Set();
    const items = req.body.items.map((i) => ({
      day: v.int(i.day, 'jour', { required: true, min: 0, max: 6 }),
      slot: v.oneOf(i.slot, 'repas', SLOTS, { required: true }),
      meal_id: v.int(i.meal_id, 'plat', { required: true, min: 1 }),
    })).filter((i) => { const k = i.day + i.slot; if (seen.has(k)) return false; seen.add(k); return true; });
    const ids = [...new Set(items.map((i) => i.meal_id))];
    if (ids.length) {
      const found = await db.one('SELECT count(*)::int AS n FROM meals WHERE id = ANY($1::int[])', [ids]);
      if (found.n !== ids.length) throw new HttpError(400, 'Un des plats n\'existe pas');
    }
    await db.query(`INSERT INTO menu_plans (client_id, week_start, items, note) VALUES ($1, $2, $3, $4)
      ON CONFLICT (client_id, week_start) DO UPDATE SET items = $3, note = $4, updated_at = now()`, [id, week, JSON.stringify(items), v.str(req.body.note, 'note', { max: 1000 })]);
    return menuWithMeals(id, week);
  });
  r.post('/api/admin/clients/:id/menu/copy', admin, async (req) => {
    const id = v.id(req.params.id);
    const to = mondayOf(v.date(req.body.week_start, 'semaine', { required: true }));
    const from = await db.one('SELECT items, note FROM menu_plans WHERE client_id = $1 AND week_start = $2', [id, addDays(to, -7)]);
    if (!from) throw new HttpError(404, 'Aucun menu la semaine précédente');
    await db.query(`INSERT INTO menu_plans (client_id, week_start, items, note) VALUES ($1, $2, $3, $4)
      ON CONFLICT (client_id, week_start) DO UPDATE SET items = $3, note = $4, updated_at = now()`, [id, to, JSON.stringify(from.items), from.note]);
    return menuWithMeals(id, to);
  });

  // ---------- Abonnement repas (géré par Annick) ----------
  r.put('/api/admin/clients/:id/subscription', admin, async (req) => {
    const id = v.id(req.params.id);
    await clientExists(id);
    const b = req.body;
    const row = await db.one(`INSERT INTO meal_subscriptions (client_id, formula, delivery_days, address, quartier, instructions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (client_id) DO UPDATE SET formula = $2, delivery_days = $3, address = $4, quartier = $5, instructions = $6, status = $7, updated_at = now() RETURNING *`, [
      id, v.oneOf(b.formula, 'formule', Object.keys(FORMULAS), { required: true }),
      v.list(b.delivery_days, 'jours', ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']),
      v.str(b.address, 'adresse', { max: 300 }), v.str(b.quartier, 'quartier', { max: 100 }), v.str(b.instructions, 'instructions', { max: 500 }),
      v.oneOf(b.status, 'statut', ['actif', 'pause', 'arrete']) || 'actif']);
    return row;
  });

  // ---------- Agenda ----------
  r.get('/api/admin/appointments', admin, async (req) => {
    const from = v.date(req.query.from, 'du') || addDays(todayLocal(), -7);
    const to = v.date(req.query.to, 'au') || addDays(todayLocal(), 30);
    return { appointments: await db.many(`SELECT a.*, u.first_name, u.last_name, u.phone, u.email FROM appointments a JOIN users u ON u.id = a.client_id
      WHERE a.starts_at >= $1::date AND a.starts_at < $2::date + 1 ORDER BY a.starts_at`, [from, to]) };
  });
  r.post('/api/admin/appointments', admin, async (req) => {
    const b = req.body;
    const id = v.id(b.client_id, 'client');
    await clientExists(id);
    const date = v.date(b.date, 'date', { required: true });
    const time = v.str(b.time, 'heure', { required: true, max: 5 });
    if (!/^\d{2}:\d{2}$/.test(time)) throw new HttpError(400, 'Heure invalide');
    const s = await getSettings();
    try {
      return await db.one(`INSERT INTO appointments (client_id, starts_at, duration_min, format, kind) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, localToUtc(date, time, config.timezone), s.agenda.slot_minutes || 60, v.oneOf(b.format, 'format', ['cabinet', 'visio']) || 'cabinet', v.oneOf(b.kind, 'type', ['bilan', 'suivi']) || 'suivi']);
    } catch (e) { if (e.code === '23505') throw new HttpError(409, 'Ce créneau est déjà pris'); throw e; }
  });
  r.put('/api/admin/appointments/:id', admin, async (req) => {
    const st = v.oneOf(req.body.status, 'statut', ['confirme', 'termine', 'annule', 'absent'], { required: true });
    const row = await db.one('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [st, v.id(req.params.id)]);
    if (!row) throw new HttpError(404, 'Rendez-vous introuvable');
    return row;
  });
  r.get('/api/admin/availability', admin, async () => ({ availability: await db.many('SELECT * FROM availability ORDER BY weekday, start_time') }));
  r.put('/api/admin/availability', admin, async (req) => {
    if (!Array.isArray(req.body.availability) || req.body.availability.length > 50) throw new HttpError(400, 'Disponibilités invalides');
    const rows = req.body.availability.map((a) => {
      const wd = v.int(a.weekday, 'jour', { required: true, min: 0, max: 6 });
      const st = v.str(a.start_time, 'début', { required: true, max: 5 });
      const en = v.str(a.end_time, 'fin', { required: true, max: 5 });
      if (!/^\d{2}:\d{2}$/.test(st) || !/^\d{2}:\d{2}$/.test(en) || st >= en) throw new HttpError(400, 'Plage horaire invalide');
      return [wd, st, en];
    });
    await db.tx(async (t) => {
      await t.query('DELETE FROM availability');
      for (const r0 of rows) await t.query('INSERT INTO availability (weekday, start_time, end_time) VALUES ($1, $2, $3)', r0);
    });
    return { ok: true };
  });

  // ---------- Messagerie ----------
  r.get('/api/admin/conversations', admin, async () => ({
    conversations: await db.many(`SELECT u.id AS client_id, u.first_name, u.last_name, last.body, last.created_at, last.automatic,
        (SELECT count(*)::int FROM messages m WHERE m.client_id = u.id AND m.sender_id = u.id AND m.read_at IS NULL) AS unread
       FROM users u JOIN LATERAL (SELECT body, created_at, automatic FROM messages WHERE client_id = u.id ORDER BY created_at DESC LIMIT 1) last ON true
      WHERE u.role = 'client' ORDER BY last.created_at DESC`),
  }));
  r.get('/api/admin/clients/:id/messages', admin, async (req) => {
    const id = v.id(req.params.id);
    await db.query('UPDATE messages SET read_at = now() WHERE client_id = $1 AND sender_id = $1 AND read_at IS NULL', [id]);
    return { messages: await db.many(`SELECT m.*, (m.sender_id IS DISTINCT FROM m.client_id) AS mine FROM messages m WHERE client_id = $1 ORDER BY created_at LIMIT 500`, [id]) };
  });
  r.post('/api/admin/clients/:id/messages', admin, async (req) => {
    const id = v.id(req.params.id);
    const u = await clientExists(id);
    const body = v.str(req.body.body, 'message', { required: !req.body.photo, max: 4000 }) || '';
    const photo = savePhoto(req.body.photo);
    const m = await db.one('INSERT INTO messages (client_id, sender_id, body, photo) VALUES ($1, $2, $3, $4) RETURNING *', [id, req.user.id, body, photo]);
    notify(u.email, 'Nouveau message d\'Annick', `Bonjour ${u.first_name},\n\nAnnick vous a écrit. Lisez son message dans votre espace Vélona : ${config.appUrl}/app/messages`);
    return m;
  });

  // ---------- Factures ----------
  r.get('/api/admin/invoices', admin, async (req) => {
    const st = v.oneOf(req.query.status, 'statut', ['en_attente', 'declaree', 'payee', 'annulee']);
    return { invoices: await db.many(`SELECT i.*, u.first_name, u.last_name FROM invoices i JOIN users u ON u.id = i.client_id
      WHERE ($1::text IS NULL OR i.status = $1) ORDER BY i.issued_at DESC LIMIT 500`, [st]) };
  });
  r.post('/api/admin/invoices', admin, async (req) => {
    const b = req.body;
    const id = v.id(b.client_id, 'client');
    const u = await clientExists(id);
    if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30) throw new HttpError(400, 'Ajoutez au moins une ligne');
    const items = b.items.map((i, k) => ({
      label: v.str(i.label, `ligne ${k + 1}`, { required: true, max: 200 }),
      amount_mga: v.int(i.amount_mga, `montant ${k + 1}`, { required: true, min: 0, max: 100000000 }),
    }));
    const total = items.reduce((s, i) => s + i.amount_mga, 0);
    const inv = await db.tx((t) => createInvoice(t, { client_id: id, label: v.str(b.label, 'intitulé', { max: 200 }) || items[0].label, items, amount_mga: total, due_days: v.int(b.due_days, 'échéance', { min: 0, max: 90 }) ?? 7 }));
    notify(u.email, `Votre facture ${inv.number}`, `Bonjour ${u.first_name},\n\nUne nouvelle facture est disponible dans votre espace : ${inv.label}, ${total.toLocaleString('fr-FR')} MGA.\n\nAnnick`);
    return inv;
  });
  r.post('/api/admin/invoices/:id/confirm', admin, async (req) => {
    const method = v.oneOf(req.body.method, 'moyen de paiement', ['mvola', 'orange_money', 'airtel_money', 'especes', 'virement']);
    const inv = await db.one(`UPDATE invoices SET status = 'payee', paid_at = now(), method = coalesce($1, method), payment_ref = coalesce($2, payment_ref)
      WHERE id = $3 AND status IN ('en_attente', 'declaree') RETURNING *`, [method, v.str(req.body.ref, 'référence', { max: 100 }), v.id(req.params.id)]);
    if (!inv) throw new HttpError(400, 'Cette facture ne peut pas être confirmée');
    return inv;
  });
  r.post('/api/admin/invoices/:id/reject', admin, async (req) => {
    const inv = await db.one(`UPDATE invoices SET status = 'en_attente', declared_at = NULL WHERE id = $1 AND status = 'declaree' RETURNING *`, [v.id(req.params.id)]);
    if (!inv) throw new HttpError(400, 'Rien à rejeter');
    await db.query('INSERT INTO messages (client_id, sender_id, body) VALUES ($1, $2, $3)', [inv.client_id, req.user.id,
      `Je n'ai pas retrouvé votre paiement pour la facture ${inv.number}. Pouvez-vous vérifier la référence et la renvoyer ? Merci !`]);
    return inv;
  });
  r.post('/api/admin/invoices/:id/cancel', admin, async (req) => {
    const inv = await db.one(`UPDATE invoices SET status = 'annulee' WHERE id = $1 AND status <> 'payee' RETURNING *`, [v.id(req.params.id)]);
    if (!inv) throw new HttpError(400, 'Une facture payée ne peut pas être annulée');
    return inv;
  });

  // ---------- Prospects (tests de vitalité) ----------
  r.get('/api/admin/leads', admin, async () => ({
    leads: await db.many(`SELECT t.*, u.first_name AS client_first_name, u.last_name AS client_last_name FROM vitality_tests t
      LEFT JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 300`),
  }));

  // ---------- Paramètres et équipe ----------
  r.get('/api/admin/settings', admin, async () => getSettings());
  r.put('/api/admin/settings', admin, async (req) => saveSettings(req.body));

  r.get('/api/admin/staff', admin, async () => ({ staff: await db.many(`SELECT id, role, email, phone, first_name, last_name, active, last_login_at FROM users WHERE role <> 'client' ORDER BY role, first_name`) }));
  r.post('/api/admin/staff', admin, async (req) => {
    const b = req.body;
    const email = v.email(b.email);
    if (await db.one('SELECT id FROM users WHERE lower(email) = $1', [email])) throw new HttpError(409, 'E-mail déjà utilisé');
    const pwd = tempPassword();
    const u = await db.one(`INSERT INTO users (role, email, phone, password_hash, first_name, last_name, must_change_password) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [v.oneOf(b.role, 'rôle', ['admin', 'kitchen'], { required: true }), email, v.str(b.phone, 'téléphone', { max: 30 }), hashPassword(pwd),
        v.str(b.first_name, 'prénom', { required: true, max: 80 }), v.str(b.last_name, 'nom', { max: 80 }) || '']);
    return { id: u.id, temp_password: pwd };
  });
  r.put('/api/admin/staff/:id', admin, async (req) => {
    const id = v.id(req.params.id);
    if (id === req.user.id && req.body.active === false) throw new HttpError(400, 'Vous ne pouvez pas désactiver votre propre compte');
    const row = await db.one(`UPDATE users SET active = $1 WHERE id = $2 AND role <> 'client' RETURNING id, active`, [v.bool(req.body.active), id]);
    if (!row) throw new HttpError(404, 'Compte introuvable');
    if (!row.active) await db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    return row;
  });

  r.get('/api/admin/emails', admin, async () => ({ emails: await db.many('SELECT * FROM email_log ORDER BY created_at DESC LIMIT 100') }));
};

module.exports.fullName = fullName;
