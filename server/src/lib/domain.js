'use strict';
// Règles métier : paramètres, formules repas, génération des commandes, alertes, factures, photos.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, config, todayLocal, addDays, mondayOf, WEEKDAYS_FR } = require('./core');
const { HttpError } = require('./http');

// ---------- Paramètres ----------
const DEFAULT_SETTINGS = {
  cabinet: { name: 'Vélona', practitioner: 'Annick Tchuidjang', title: 'Nutritionniste', address: 'Ivandry, Antananarivo', city: 'Antananarivo', phone: '', whatsapp: '+261 38 08 320 20', email: 'randriamasinjakaandriniaina@gmail.com' },
  prices: { bilan: 0, suivi: 0, programme_30: 0, programme_60: 0, programme_90: 0, essentiel: 0, equilibre: 0, serenite: 0, livraison: 0 },
  payment: { mvola: '', orange_money: '', airtel_money: '', instructions: 'Indiquez votre nom et le numéro de facture en référence du paiement.' },
  agenda: { slot_minutes: 60, min_notice_hours: 12, days_ahead: 21 },
  delivery: { days: ['lundi', 'jeudi'], quartiers: [] },
  messaging: { auto_reply: 'Merci pour votre message. Annick vous répond sous 24 h (jours ouvrés). Pour tout symptôme inquiétant ou toute urgence, contactez un médecin ou les urgences.' },
};

async function getSettings() {
  const rows = await db.many('SELECT key, value FROM settings');
  const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const r of rows) if (out[r.key] !== undefined) out[r.key] = { ...out[r.key], ...r.value };
  return out;
}

async function saveSettings(patch) {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (patch[key] === undefined) continue;
    if (typeof patch[key] !== 'object' || Array.isArray(patch[key])) throw new HttpError(400, 'Paramètres invalides');
    // Ne garde que les clés connues
    const clean = {};
    for (const k of Object.keys(DEFAULT_SETTINGS[key])) if (patch[key][k] !== undefined) clean[k] = patch[key][k];
    await db.query(`INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = settings.value || EXCLUDED.value`, [key, clean]);
  }
  return getSettings();
}

// ---------- Formules repas ----------
const FORMULAS = {
  essentiel: { label: 'Essentiel', perWeek: 5, days: [0, 1, 2, 3, 4], slots: ['dejeuner'] },
  equilibre: { label: 'Équilibre', perWeek: 10, days: [0, 1, 2, 3, 4], slots: ['dejeuner', 'diner'] },
  serenite: { label: 'Sérénité', perWeek: 14, days: [0, 1, 2, 3, 4, 5, 6], slots: ['dejeuner', 'diner'] },
};
const SLOT_LABELS = { 'petit-dejeuner': 'Petit-déjeuner', dejeuner: 'Déjeuner', diner: 'Dîner', collation: 'Collation' };

// Répartit les jours de la semaine entre les jours de livraison.
// Ex. lundi + jeudi : la livraison du lundi couvre lun→mer, celle du jeudi couvre jeu→dim.
function deliveryCoverage(deliveryDays) {
  const idx = deliveryDays.map((d) => WEEKDAYS_FR.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b);
  if (!idx.length) return [];
  return idx.map((start, k) => {
    const end = k + 1 < idx.length ? idx[k + 1] - 1 : 6;
    const days = [];
    for (let d = start; d <= end; d++) days.push(d);
    // Les jours avant la première livraison sont rattachés à la première
    if (k === 0) for (let d = 0; d < start; d++) days.push(d);
    return { deliveryDay: start, days: days.sort((a, b) => a - b) };
  });
}

// Génère (ou met à jour) les commandes d'une semaine à partir des abonnements et des menus.
async function generateOrders(weekStart) {
  const ws = mondayOf(weekStart);
  const subs = await db.many(`SELECT s.*, u.first_name, u.last_name FROM meal_subscriptions s JOIN users u ON u.id = s.client_id
    WHERE s.status = 'actif' AND u.active`);
  const meals = new Map((await db.many('SELECT id, name FROM meals')).map((m) => [m.id, m.name]));
  const report = { week_start: ws, created: 0, updated: 0, skipped_locked: 0, missing_menus: [] };
  for (const s of subs) {
    const f = FORMULAS[s.formula];
    const plan = await db.one('SELECT items FROM menu_plans WHERE client_id = $1 AND week_start = $2', [s.client_id, ws]);
    if (!plan) report.missing_menus.push({ client_id: s.client_id, name: `${s.first_name} ${s.last_name}`.trim() });
    const items = plan ? plan.items : [];
    for (const cov of deliveryCoverage(s.delivery_days)) {
      const date = addDays(ws, cov.deliveryDay);
      const orderItems = [];
      for (const day of cov.days) {
        if (!f.days.includes(day)) continue;
        for (const slot of f.slots) {
          const it = items.find((x) => x.day === day && x.slot === slot);
          const mealId = it ? it.meal_id : null;
          orderItems.push({ day, slot, meal_id: mealId, name: mealId ? (meals.get(mealId) || 'Repas supprimé') : 'À définir' });
        }
      }
      if (!orderItems.length) continue;
      const existing = await db.one('SELECT id, status FROM meal_orders WHERE client_id = $1 AND delivery_date = $2', [s.client_id, date]);
      if (existing && existing.status !== 'a_preparer') { report.skipped_locked++; continue; }
      if (existing) {
        await db.query(`UPDATE meal_orders SET items = $1, address = $2, quartier = $3, instructions = $4, updated_at = now() WHERE id = $5`,
          [JSON.stringify(orderItems), s.address, s.quartier, s.instructions, existing.id]);
        report.updated++;
      } else {
        await db.query(`INSERT INTO meal_orders (client_id, delivery_date, items, address, quartier, instructions) VALUES ($1, $2, $3, $4, $5, $6)`,
          [s.client_id, date, JSON.stringify(orderItems), s.address, s.quartier, s.instructions]);
        report.created++;
      }
    }
  }
  return report;
}

// Liste de courses : somme des ingrédients (par portion) des repas à préparer sur la période.
async function shoppingList(from, to) {
  const orders = await db.many(`SELECT items FROM meal_orders WHERE delivery_date BETWEEN $1 AND $2 AND status <> 'incident'`, [from, to]);
  const counts = new Map();
  for (const o of orders) for (const it of o.items) if (it.meal_id) counts.set(it.meal_id, (counts.get(it.meal_id) || 0) + 1);
  if (!counts.size) return { meals: [], ingredients: [] };
  const meals = await db.many('SELECT id, name, ingredients FROM meals WHERE id = ANY($1::int[])', [[...counts.keys()]]);
  const ing = new Map();
  for (const m of meals) {
    const n = counts.get(m.id);
    for (const i of m.ingredients || []) {
      const key = (i.name || '').trim().toLowerCase() + '|' + (i.unit || '');
      const cur = ing.get(key) || { name: (i.name || '').trim(), unit: i.unit || '', qty: 0 };
      cur.qty += (parseFloat(i.qty) || 0) * n;
      ing.set(key, cur);
    }
  }
  return {
    meals: meals.map((m) => ({ id: m.id, name: m.name, portions: counts.get(m.id) })).sort((a, b) => b.portions - a.portions),
    ingredients: [...ing.values()].map((x) => ({ ...x, qty: Math.round(x.qty * 100) / 100 })).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  };
}

// ---------- Factures ----------
async function createInvoice(t, { client_id, label, items, amount_mga, due_days = 7 }) {
  const seq = await t.one(`SELECT nextval('invoice_seq')::int AS n`);
  const year = todayLocal().slice(0, 4);
  const number = `VEL-${year}-${String(seq.n).padStart(4, '0')}`;
  return t.one(`INSERT INTO invoices (number, client_id, label, items, amount_mga, due_date)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [number, client_id, label, JSON.stringify(items || []), amount_mga, addDays(todayLocal(), due_days)]);
}

// ---------- Alertes du cockpit ----------
async function computeAlerts() {
  const alerts = [];
  const today = todayLocal();
  // 1. Clients en programme actif sans check-in depuis 10 jours ou plus
  const silent = await db.many(`
    SELECT u.id, u.first_name, u.last_name, p.start_date,
           (SELECT max(created_at) FROM checkins c WHERE c.client_id = u.id) AS last_checkin
      FROM programs p JOIN users u ON u.id = p.client_id
     WHERE p.status = 'actif' AND u.active AND p.start_date <= $1::date - 7`, [today]);
  for (const s of silent) {
    const last = s.last_checkin ? new Date(s.last_checkin) : null;
    const days = last ? Math.floor((Date.now() - last.getTime()) / 86400000) : null;
    if (days === null || days >= 10) {
      alerts.push({ type: 'silence', level: 'warning', client_id: s.id, client: `${s.first_name} ${s.last_name}`.trim(),
        title: days === null ? 'Aucun check-in depuis le début du programme' : `Sans check-in depuis ${days} jours` });
    }
  }
  // 2. Tendances : poids en hausse sur 2 relevés, glycémie en hausse de plus de 10 %
  const recent = await db.many(`
    SELECT client_id, array_agg(weight ORDER BY created_at DESC) AS w, array_agg(glucose ORDER BY created_at DESC) AS g
      FROM (SELECT client_id, weight, glucose, created_at,
                   row_number() OVER (PARTITION BY client_id ORDER BY created_at DESC) AS rn
              FROM checkins) x
     WHERE rn <= 3 GROUP BY client_id`);
  const names = new Map((await db.many(`SELECT id, first_name, last_name FROM users WHERE role = 'client'`)).map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]));
  for (const r of recent) {
    const w = r.w.map((x) => (x === null ? null : parseFloat(x))).filter((x) => x !== null);
    if (w.length >= 3 && w[0] > w[1] && w[1] > w[2]) {
      alerts.push({ type: 'poids', level: 'warning', client_id: r.client_id, client: names.get(r.client_id), title: `Poids en hausse sur les 2 derniers relevés (+${(w[0] - w[2]).toFixed(1)} kg)` });
    }
    const g = r.g.map((x) => (x === null ? null : parseFloat(x))).filter((x) => x !== null);
    if (g.length >= 2 && g[1] > 0 && (g[0] - g[1]) / g[1] > 0.1) {
      alerts.push({ type: 'glycemie', level: 'danger', client_id: r.client_id, client: names.get(r.client_id), title: `Glycémie en hausse (${String(g[1]).replace('.', ',')} → ${String(g[0]).replace('.', ',')} g/L)` });
    }
  }
  // 3. Paiements
  const inv = await db.many(`SELECT i.id, i.number, i.status, i.amount_mga, i.due_date, i.client_id, u.first_name, u.last_name
      FROM invoices i JOIN users u ON u.id = i.client_id
     WHERE i.status = 'declaree' OR (i.status = 'en_attente' AND i.due_date < $1)`, [today]);
  for (const i of inv) {
    alerts.push({ type: 'paiement', level: i.status === 'declaree' ? 'info' : 'danger', client_id: i.client_id, invoice_id: i.id,
      client: `${i.first_name} ${i.last_name}`.trim(),
      title: i.status === 'declaree' ? `Paiement déclaré à confirmer (${i.number})` : `Paiement en retard (${i.number})` });
  }
  // 4. Programmes qui se terminent dans les 7 jours (renouvellement)
  const ending = await db.many(`SELECT p.client_id, p.end_date, p.kind, u.first_name, u.last_name FROM programs p JOIN users u ON u.id = p.client_id
     WHERE p.status = 'actif' AND p.end_date BETWEEN $1 AND $1::date + 7`, [today]);
  for (const p of ending) {
    alerts.push({ type: 'fin_programme', level: 'info', client_id: p.client_id, client: `${p.first_name} ${p.last_name}`.trim(),
      title: `Programme ${p.kind} jours terminé le ${p.end_date.split('-').reverse().join('/')} : proposer la suite` });
  }
  const order = { danger: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.level] - order[b.level]);
}

// ---------- Photos (check-ins, messages) ----------
function savePhoto(dataUrl) {
  if (!dataUrl) return null;
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new HttpError(400, 'Photo invalide (JPEG, PNG ou WebP attendu)');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 4 * 1024 * 1024) throw new HttpError(400, 'Photo trop lourde (4 Mo maximum)');
  const sig = buf.subarray(0, 12).toString('hex');
  const ok = (m[1] === 'jpeg' && sig.startsWith('ffd8ff')) || (m[1] === 'png' && sig.startsWith('89504e47')) || (m[1] === 'webp' && sig.startsWith('52494646') && sig.slice(16, 24) === '57454250');
  if (!ok) throw new HttpError(400, 'Le fichier n\'est pas une image valide');
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  const name = crypto.randomBytes(16).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.writeFileSync(path.join(config.uploadsDir, name), buf, { mode: 0o600 });
  return name;
}

module.exports = {
  DEFAULT_SETTINGS, getSettings, saveSettings, FORMULAS, SLOT_LABELS, deliveryCoverage, generateOrders, shoppingList,
  createInvoice, computeAlerts, savePhoto,
};
