'use strict';
// Tests de bout en bout de l'API (serveur lancé sur BASE, base avec données de démonstration).
// Lancement : node test/api.test.js
const assert = require('assert');
const BASE = process.env.BASE || 'http://localhost:3000';

function agent() {
  let cookie = '';
  return async function call(method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Velona': '1', cookie },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };
}

const results = [];
async function test(name, fn) {
  try { await fn(); results.push(['OK', name]); } catch (e) { results.push(['ÉCHEC', name, e.message]); }
}

(async () => {
  const anon = agent();
  const client = agent();
  const admin = agent();
  const kitchen = agent();
  const email = `test${Date.now()}@velona.test`;
  let testId, clientId, invoiceId, slot;

  await test('CSRF : requête sans en-tête refusée', async () => {
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    assert.strictEqual(r.status, 403);
  });
  await test('Test de vitalité public', async () => {
    const r = await anon('POST', '/api/public/vitality', { answers: [3, 2, 2, 1, 1, 0, 2, 3, 1, 2, 2, 1] });
    assert.strictEqual(r.status, 200); assert.strictEqual(r.data.score, 56); testId = r.data.id;
  });
  await test('Test de vitalité : réponses invalides refusées', async () => {
    const r = await anon('POST', '/api/public/vitality', { answers: [9] });
    assert.strictEqual(r.status, 400);
  });
  await test('Inscription sans consentement refusée', async () => {
    const r = await client('POST', '/api/auth/register', { first_name: 'Test', last_name: 'Client', email, phone: '+261', password: 'motdepasse123' });
    assert.strictEqual(r.status, 400);
  });
  await test('Inscription', async () => {
    const r = await client('POST', '/api/auth/register', { first_name: 'Test', last_name: 'Client', email, phone: '+261 34 11 111 11', password: 'motdepasse123', consent: true, test_id: testId });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data)); clientId = r.data.user.id;
  });
  await test('Inscription en double refusée', async () => {
    const r = await anon('POST', '/api/auth/register', { first_name: 'X', last_name: 'Y', email, phone: '1', password: 'motdepasse123', consent: true });
    assert.strictEqual(r.status, 409);
  });
  await test('Session client', async () => {
    const r = await client('GET', '/api/auth/me'); assert.strictEqual(r.data.user.role, 'client');
  });
  await test('Client : accès cockpit interdit', async () => {
    const r = await client('GET', '/api/admin/dashboard'); assert.strictEqual(r.status, 403);
  });
  await test('Anonyme : espace client interdit', async () => {
    const r = await anon('GET', '/api/me/dashboard'); assert.strictEqual(r.status, 401);
  });
  await test('Fiche de renseignements client', async () => {
    let r = await client('PUT', '/api/me/profile', { quartier: 'Ivandry', conditions: ['diabete'], habits: { breakfast: 'Pain, café', breakfast_time: '07:00' }, allergies: 'Arachides' });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data));
    r = await client('GET', '/api/me/profile'); assert.deepStrictEqual(r.data.profile.conditions, ['diabete']); assert.strictEqual(r.data.profile.habits.breakfast, 'Pain, café');
  });
  await test('Check-in avec photo', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const r = await client('POST', '/api/me/checkins', { weight: '72,4', waist: 85, energy: 4, sleep: 'bon', note: 'Bonne semaine', photo: png });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data)); assert.strictEqual(r.data.weight, 72.4); assert.ok(r.data.photo);
    const f = await client('GET', '/api/files/' + r.data.photo); assert.strictEqual(f.status, 200);
    const other = await anon('GET', '/api/files/' + r.data.photo); assert.strictEqual(other.status, 401);
  });
  await test('Check-in : faux fichier image refusé', async () => {
    const r = await client('POST', '/api/me/checkins', { weight: 72, photo: 'data:image/png;base64,' + Buffer.from('<script>').toString('base64') });
    assert.strictEqual(r.status, 400);
  });
  await test('Créneaux et réservation', async () => {
    const r = await client('GET', '/api/me/appointments'); assert.ok(r.data.slots.length > 0); slot = r.data.slots[0];
    const b = await client('POST', '/api/me/appointments', { starts_at: slot.starts_at, format: 'visio', kind: 'bilan' });
    assert.strictEqual(b.status, 200, JSON.stringify(b.data));
    const again = await client('POST', '/api/me/appointments', { starts_at: slot.starts_at, format: 'visio' });
    assert.strictEqual(again.status, 409);
  });
  await test('Abonnement repas', async () => {
    const r = await client('PUT', '/api/me/meals', { formula: 'equilibre', delivery_days: ['lundi', 'jeudi'], address: 'Lot test', quartier: 'Ivandry' });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  });
  await test('Message client + réponse automatique', async () => {
    const r = await client('POST', '/api/me/messages', { body: 'Bonjour Annick' }); assert.strictEqual(r.status, 200);
    const l = await client('GET', '/api/me/messages'); assert.strictEqual(l.data.messages.length, 2); assert.ok(l.data.messages[1].automatic);
  });
  await test('Connexion admin (mauvais mot de passe refusé)', async () => {
    const bad = await admin('POST', '/api/auth/login', { email: 'annick@velona.test', password: 'faux' }); assert.strictEqual(bad.status, 401);
    const r = await admin('POST', '/api/auth/login', { email: 'annick@velona.test', password: 'Annick-Velona-2026' }); assert.strictEqual(r.status, 200);
  });
  await test('Tableau de bord du cockpit', async () => {
    const r = await admin('GET', '/api/admin/dashboard');
    assert.strictEqual(r.status, 200, JSON.stringify(r.data)); assert.ok(r.data.kpis.active_clients >= 5); assert.strictEqual(r.data.revenue.length, 6);
    assert.ok(r.data.alerts.some((a) => a.type === 'silence'), 'alerte silence attendue');
    assert.ok(r.data.alerts.some((a) => a.type === 'glycemie'), 'alerte glycémie attendue');
  });
  await test('Liste et dossier client', async () => {
    const l = await admin('GET', '/api/admin/clients?q=' + encodeURIComponent(email)); assert.strictEqual(l.data.clients.length, 1);
    const d = await admin('GET', '/api/admin/clients/' + clientId); assert.strictEqual(d.data.profile.allergies, 'Arachides'); assert.strictEqual(d.data.tests.length, 1);
  });
  await test('Consultation (fiche praticien)', async () => {
    const r = await admin('POST', `/api/admin/clients/${clientId}/consultations`, { weight: 73, height: 165, waist: 86, hip: 100, bp: '12/8', glucose: '1,05 g/L', conclusion: 'Programme 90 jours', peds: {} });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data));
    const u = await admin('PUT', '/api/admin/consultations/' + r.data.id, { observations: 'RAS' }); assert.strictEqual(u.data.observations, 'RAS');
  });
  await test('Programme + facture', async () => {
    const r = await admin('POST', `/api/admin/clients/${clientId}/programs`, { kind: '90', goal_label: '-6 kg en 90 jours', start_value: 73, target_value: 67, invoice_amount: 450000 });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data)); assert.match(r.data.invoice.number, /^VEL-\d{4}-\d{4}$/); invoiceId = r.data.invoice.id;
    const d = await client('GET', '/api/me/dashboard'); assert.strictEqual(d.data.progress.current, 72.4); assert.ok(d.data.progress.pct > 0);
  });
  await test('Paiement déclaré puis confirmé', async () => {
    const r = await client('POST', `/api/me/invoices/${invoiceId}/declare`, { method: 'mvola', ref: 'MV123' }); assert.strictEqual(r.data.status, 'declaree');
    const twice = await client('POST', `/api/me/invoices/${invoiceId}/declare`, { method: 'mvola', ref: 'MV123' }); assert.strictEqual(twice.status, 400);
    const c = await admin('POST', `/api/admin/invoices/${invoiceId}/confirm`, {}); assert.strictEqual(c.data.status, 'payee');
  });
  await test('Menu de la semaine (cockpit → client)', async () => {
    const meals = (await admin('GET', '/api/admin/meals')).data.meals;
    const lunch = meals.find((m) => m.meal_type === 'dejeuner'); const dinner = meals.find((m) => m.meal_type === 'diner');
    const week = (await client('GET', '/api/me/next-weeks')).data.weeks[1];
    const items = [];
    for (let d = 0; d < 7; d++) { items.push({ day: d, slot: 'dejeuner', meal_id: lunch.id }); items.push({ day: d, slot: 'diner', meal_id: dinner.id }); }
    const r = await admin('PUT', `/api/admin/clients/${clientId}/menu`, { week_start: week, items }); assert.strictEqual(r.status, 200, JSON.stringify(r.data));
    const m = await client('GET', '/api/me/menu?week=' + week); assert.strictEqual(m.data.items.length, 14); assert.strictEqual(m.data.items[0].meal.name, lunch.name);
  });
  await test('Bibliothèque de repas : création', async () => {
    const r = await admin('POST', '/api/admin/meals', { name: 'Test plat', meal_type: 'diner', ingredients: [{ name: 'riz', qty: 70, unit: 'g' }] });
    assert.strictEqual(r.status, 200, JSON.stringify(r.data)); assert.strictEqual(r.data.ingredients[0].qty, 70);
  });
  await test('Cuisine : génération, production, courses', async () => {
    const k = await kitchen('POST', '/api/auth/login', { email: 'cuisine@velona.test', password: 'Cuisine-Velona-2026' }); assert.strictEqual(k.status, 200);
    const week = (await client('GET', '/api/me/next-weeks')).data.weeks[1];
    const g = await kitchen('POST', '/api/kitchen/generate', { week_start: week }); assert.strictEqual(g.status, 200, JSON.stringify(g.data));
    const o = await kitchen('GET', `/api/kitchen/orders?from=${week}&to=${week}`);
    const mine = o.data.orders.find((x) => x.client_id === clientId);
    assert.ok(mine, 'commande du lundi attendue'); assert.strictEqual(mine.items.length, 6, 'lundi→mercredi : 3 jours × 2 repas');
    assert.strictEqual(mine.allergies, 'Arachides');
    const s = await kitchen('GET', `/api/kitchen/shopping?from=${week}&to=${week}`); assert.ok(s.data.ingredients.length > 0);
    const inc = await kitchen('PUT', '/api/kitchen/orders/' + mine.id, { status: 'incident' }); assert.strictEqual(inc.status, 400);
    const ok = await kitchen('PUT', '/api/kitchen/orders/' + mine.id, { status: 'pret' }); assert.strictEqual(ok.data.status, 'pret');
    const forbidden = await kitchen('GET', '/api/admin/clients'); assert.strictEqual(forbidden.status, 403);
  });
  await test('Revue de check-in envoyée en message', async () => {
    const list = await admin('GET', '/api/admin/checkins?unreviewed=1');
    const c = list.data.checkins.find((x) => x.client_id === clientId);
    const r = await admin('POST', `/api/admin/checkins/${c.id}/review`, { note: 'Très bien, continuez !' }); assert.ok(r.data.reviewed_at);
    const m = await client('GET', '/api/me/messages'); assert.ok(m.data.messages.some((x) => x.body === 'Très bien, continuez !'));
  });
  await test('Paramètres (prix)', async () => {
    const r = await admin('PUT', '/api/admin/settings', { prices: { bilan: 50000 }, hack: { x: 1 } });
    assert.strictEqual(r.data.prices.bilan, 50000); assert.strictEqual(r.data.hack, undefined);
    const p = await anon('GET', '/api/public/settings'); assert.strictEqual(p.data.prices.bilan, 50000);
  });
  await test('Changement de mot de passe', async () => {
    const r = await client('POST', '/api/auth/password', { current: 'motdepasse123', next: 'nouveau-mdp-456' }); assert.strictEqual(r.status, 200);
    const me = await client('GET', '/api/auth/me'); assert.ok(me.data.user, 'la session courante reste active');
  });
  await test('Réinitialisation par Annick + désactivation', async () => {
    const r = await admin('POST', `/api/admin/clients/${clientId}/reset-password`); assert.ok(r.data.temp_password.length >= 10);
    const me = await client('GET', '/api/auth/me'); assert.strictEqual(me.data.user, null, 'sessions révoquées');
  });
  await test('Injection SQL dans la recherche sans effet', async () => {
    const r = await admin('GET', "/api/admin/clients?q=" + encodeURIComponent("' OR 1=1 --")); assert.strictEqual(r.status, 200); assert.strictEqual(r.data.clients.length, 0);
  });
  await test('Déconnexion', async () => {
    await admin('POST', '/api/auth/logout'); const r = await admin('GET', '/api/admin/dashboard'); assert.strictEqual(r.status, 401);
  });

  for (const r of results) console.log(r[0].padEnd(6), r[1], r[2] ? '→ ' + r[2] : '');
  const failed = results.filter((r) => r[0] !== 'OK').length;
  console.log(`\n${results.length - failed}/${results.length} tests réussis`);
  process.exit(failed ? 1 : 0);
})();
