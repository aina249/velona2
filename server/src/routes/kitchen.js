'use strict';
const fs = require('fs');
const path = require('path');
const { db, v, config, todayLocal, mondayOf, addDays } = require('../lib/core');
const { HttpError } = require('../lib/http');
const { requireAuth } = require('../lib/auth');
const { generateOrders, shoppingList, FORMULAS } = require('../lib/domain');

const kitchen = requireAuth('kitchen', 'admin');

module.exports = (r) => {
  r.post('/api/kitchen/generate', kitchen, async (req) => {
    const week = mondayOf(v.date(req.body.week_start, 'semaine') || todayLocal());
    return generateOrders(week);
  });

  // Commandes d'une date (ou d'une période)
  r.get('/api/kitchen/orders', kitchen, async (req) => {
    const from = v.date(req.query.from, 'du') || todayLocal();
    const to = v.date(req.query.to, 'au') || from;
    const orders = await db.many(`SELECT o.*, u.first_name, u.last_name, u.phone, cp.allergies, cp.forbidden_foods, ms.formula
        FROM meal_orders o JOIN users u ON u.id = o.client_id
        LEFT JOIN client_profiles cp ON cp.user_id = o.client_id
        LEFT JOIN meal_subscriptions ms ON ms.client_id = o.client_id
       WHERE o.delivery_date BETWEEN $1 AND $2 ORDER BY o.delivery_date, o.quartier NULLS LAST, u.last_name`, [from, to]);
    // Production : nombre de portions par plat
    const production = new Map();
    for (const o of orders) {
      if (o.status === 'incident') continue;
      for (const it of o.items) {
        const key = it.meal_id || 'a_definir';
        const cur = production.get(key) || { meal_id: it.meal_id, name: it.name, portions: 0 };
        cur.portions++;
        production.set(key, cur);
      }
    }
    return { from, to, orders, production: [...production.values()].sort((a, b) => b.portions - a.portions) };
  });

  r.put('/api/kitchen/orders/:id', kitchen, async (req) => {
    const status = v.oneOf(req.body.status, 'statut', ['a_preparer', 'pret', 'en_livraison', 'livre', 'incident'], { required: true });
    const note = v.str(req.body.incident_note, 'incident', { max: 500 });
    if (status === 'incident' && !note) throw new HttpError(400, 'Décrivez l\'incident', { field: 'incident' });
    const row = await db.one('UPDATE meal_orders SET status = $1, incident_note = $2, updated_at = now() WHERE id = $3 RETURNING *', [status, note, v.id(req.params.id)]);
    if (!row) throw new HttpError(404, 'Commande introuvable');
    if (status === 'incident') {
      await db.query('INSERT INTO messages (client_id, sender_id, body) VALUES ($1, $2, $3)', [row.client_id, req.user.id,
        `Un incident est survenu sur votre livraison du ${row.delivery_date.split('-').reverse().join('/')} : ${note}. Nous revenons vers vous très vite.`]);
    }
    return row;
  });

  r.post('/api/kitchen/orders/bulk', kitchen, async (req) => {
    const status = v.oneOf(req.body.status, 'statut', ['pret', 'en_livraison', 'livre'], { required: true });
    const date = v.date(req.body.date, 'date', { required: true });
    const r0 = await db.query(`UPDATE meal_orders SET status = $1, updated_at = now() WHERE delivery_date = $2 AND status NOT IN ('incident', 'livre') AND status <> $1`, [status, date]);
    return { updated: r0.rowCount };
  });

  r.get('/api/kitchen/shopping', kitchen, async (req) => {
    const from = v.date(req.query.from, 'du') || todayLocal();
    const to = v.date(req.query.to, 'au') || addDays(from, 6);
    return { from, to, ...(await shoppingList(from, to)) };
  });

  // Abonnés sans menu pour la semaine
  r.get('/api/kitchen/missing', kitchen, async (req) => {
    const week = mondayOf(v.date(req.query.week_start, 'semaine') || todayLocal());
    return { week_start: week, clients: await db.many(`SELECT u.id, u.first_name, u.last_name, s.formula FROM meal_subscriptions s JOIN users u ON u.id = s.client_id
      WHERE s.status = 'actif' AND NOT EXISTS (SELECT 1 FROM menu_plans m WHERE m.client_id = s.client_id AND m.week_start = $1) ORDER BY u.last_name`, [week]),
    formulas: FORMULAS };
  });

  // Fichiers privés (photos) : le client voit les siennes, l'équipe voit tout
  r.get('/api/files/:name', requireAuth(), async (req, res) => {
    const name = req.params.name;
    if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name)) throw new HttpError(404, 'Fichier introuvable');
    if (req.user.role === 'client') {
      const own = await db.one(`SELECT 1 FROM checkins WHERE photo = $1 AND client_id = $2 UNION ALL SELECT 1 FROM messages WHERE photo = $1 AND client_id = $2 LIMIT 1`, [name, req.user.id]);
      if (!own) throw new HttpError(404, 'Fichier introuvable');
    }
    const file = path.join(config.uploadsDir, name);
    if (!fs.existsSync(file)) throw new HttpError(404, 'Fichier introuvable');
    const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'private, max-age=86400' });
    fs.createReadStream(file).pipe(res);
  });
};
