"use strict";
// Données initiales.
//   node src/seed.js --admin   crée le compte d'Annick (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME)
//   node src/seed.js --meals   ajoute la bibliothèque de repas de départ (à valider par Annick)
//   node src/seed.js --hours   ajoute des horaires de consultation par défaut
//   node src/seed.js --demo    ajoute des clients FICTIFS de démonstration (ne pas utiliser en production)
const {
  db,
  hashPassword,
  todayLocal,
  addDays,
  mondayOf,
} = require("./lib/core");
const { migrate } = require("./migrate");
const { createInvoice, generateOrders } = require("./lib/domain");

const MEALS = [
  [
    "Bouillie de riz au gingembre et banane",
    "Vary sosoa doux, rassasiant et facile à digérer",
    "petit-dejeuner",
    ["digeste"],
    [
      ["riz", 60, "g"],
      ["banane", 1, "pièce"],
      ["gingembre", 5, "g"],
    ],
  ],
  [
    "Pain complet, œuf dur et papaye",
    "Un petit-déjeuner complet qui tient jusqu'à midi",
    "petit-dejeuner",
    ["protéines"],
    [
      ["pain complet", 60, "g"],
      ["œuf", 1, "pièce"],
      ["papaye", 150, "g"],
    ],
  ],
  [
    "Yaourt nature, mangue et cacahuètes",
    "Calcium, fibres et bonnes graisses",
    "petit-dejeuner",
    ["calcium"],
    [
      ["yaourt nature", 125, "g"],
      ["mangue", 150, "g"],
      ["cacahuètes", 15, "g"],
    ],
  ],
  [
    "Patate douce vapeur et lait",
    "Énergie durable pour bien démarrer",
    "petit-dejeuner",
    ["énergie"],
    [
      ["patate douce", 150, "g"],
      ["lait", 200, "ml"],
    ],
  ],
  [
    "Romazava au bœuf maigre et brèdes, riz complet",
    "Le plat traditionnel, en version allégée",
    "dejeuner",
    ["traditionnel", "fer"],
    [
      ["bœuf maigre", 120, "g"],
      ["brèdes mafana", 100, "g"],
      ["brèdes", 100, "g"],
      ["tomate", 80, "g"],
      ["gingembre", 5, "g"],
      ["riz complet", 70, "g"],
    ],
  ],
  [
    "Poisson grillé sauce citron, riz complet et achards",
    "Riche en protéines et en oméga-3",
    "dejeuner",
    ["oméga-3"],
    [
      ["poisson", 150, "g"],
      ["citron", 0.5, "pièce"],
      ["riz complet", 70, "g"],
      ["carotte", 50, "g"],
      ["chou", 50, "g"],
    ],
  ],
  [
    "Poulet aux brèdes et riz complet",
    "Akoho sy anana, simple et équilibré",
    "dejeuner",
    ["traditionnel"],
    [
      ["poulet", 130, "g"],
      ["brèdes", 150, "g"],
      ["oignon", 30, "g"],
      ["riz complet", 70, "g"],
    ],
  ],
  [
    "Ravitoto au poulet, riz complet",
    "Feuilles de manioc pilées, sans viande grasse",
    "dejeuner",
    ["traditionnel", "fibres"],
    [
      ["feuilles de manioc", 150, "g"],
      ["poulet", 100, "g"],
      ["ail", 5, "g"],
      ["riz complet", 70, "g"],
    ],
  ],
  [
    "Lentilles aux légumes et riz complet",
    "Protéines végétales et fibres",
    "dejeuner",
    ["végétarien", "fibres"],
    [
      ["lentilles", 80, "g"],
      ["carotte", 60, "g"],
      ["tomate", 60, "g"],
      ["oignon", 30, "g"],
      ["riz complet", 50, "g"],
    ],
  ],
  [
    "Salade de haricots verts, œuf et avocat",
    "Fraîche et rassasiante",
    "dejeuner",
    ["végétarien"],
    [
      ["haricots verts", 150, "g"],
      ["œuf", 1, "pièce"],
      ["avocat", 0.5, "pièce"],
      ["tomate", 80, "g"],
    ],
  ],
  [
    "Soupe de légumes au poisson",
    "Lasopy légère pour le soir",
    "diner",
    ["léger"],
    [
      ["poisson", 100, "g"],
      ["carotte", 60, "g"],
      ["poireau", 50, "g"],
      ["pomme de terre", 100, "g"],
      ["chou", 60, "g"],
    ],
  ],
  [
    "Brèdes sautées, œufs et patate douce",
    "Un dîner simple et complet",
    "diner",
    ["végétarien"],
    [
      ["brèdes", 150, "g"],
      ["œuf", 2, "pièce"],
      ["patate douce", 150, "g"],
    ],
  ],
  [
    "Poulet vapeur au gingembre et légumes",
    "Léger, parfumé, facile à digérer",
    "diner",
    ["léger"],
    [
      ["poulet", 120, "g"],
      ["courgette", 100, "g"],
      ["carotte", 80, "g"],
      ["gingembre", 5, "g"],
    ],
  ],
  [
    "Zébu mijoté aux haricots secs",
    "Tsaramaso, version maigre",
    "diner",
    ["traditionnel", "fer"],
    [
      ["bœuf maigre", 100, "g"],
      ["haricots secs", 60, "g"],
      ["tomate", 60, "g"],
      ["oignon", 30, "g"],
    ],
  ],
  [
    "Salade de fruits locaux",
    "Mangue, ananas, banane, fruit de la passion",
    "collation",
    ["vitamines"],
    [
      ["mangue", 80, "g"],
      ["ananas", 80, "g"],
      ["banane", 0.5, "pièce"],
      ["fruit de la passion", 1, "pièce"],
    ],
  ],
  [
    "Cacahuètes grillées et banane",
    "Une collation qui coupe la faim",
    "collation",
    ["énergie"],
    [
      ["cacahuètes", 20, "g"],
      ["banane", 1, "pièce"],
    ],
  ],
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10)
    throw new Error(
      "Définissez ADMIN_EMAIL et ADMIN_PASSWORD (10 caractères minimum) dans .env"
    );
  const exists = await db.one(
    "SELECT id FROM users WHERE lower(email) = lower($1)",
    [email]
  );
  if (exists) {
    await db.query(
      `UPDATE users SET role = 'admin', password_hash = $1 WHERE id = $2`,
      [hashPassword(password), exists.id]
    );
    console.log("Compte administrateur mis à jour :", email);
    return exists.id;
  }
  const u = await db.one(
    `INSERT INTO users (role, email, password_hash, first_name, last_name) VALUES ('admin', $1, $2, $3, $4) RETURNING id`,
    [
      email.toLowerCase(),
      hashPassword(password),
      process.env.ADMIN_FIRST_NAME || "Annick",
      process.env.ADMIN_LAST_NAME || "Tchuidjang",
    ]
  );
  console.log("Compte administrateur créé :", email);
  return u.id;
}

async function seedMeals() {
  const n = await db.one("SELECT count(*)::int AS n FROM meals");
  if (n.n > 0) {
    console.log("Bibliothèque de repas déjà remplie.");
    return;
  }
  for (const [
    name,
    description,
    type,
    tags,
    /** @type {Array<[string, number, string]>} */ ing,
  ] of MEALS) {
    await db.query(
      "INSERT INTO meals (name, description, meal_type, tags, ingredients) VALUES ($1, $2, $3, $4, $5)",
      [
        name,
        description,
        type,
        tags,
        JSON.stringify(
          /** @type {Array<[string, number, string]>} */ (ing).map(
            ([n0, q, u]) => ({ name: n0, qty: q, unit: u })
          )
        ),
      ]
    );
  }
  console.log(`${MEALS.length} repas ajoutés.`);
}

async function seedHours() {
  const n = await db.one("SELECT count(*)::int AS n FROM availability");
  if (n.n > 0) return;
  for (const wd of [1, 2, 3, 4, 5]) {
    await db.query(
      `INSERT INTO availability (weekday, start_time, end_time) VALUES ($1, '09:00', '12:00'), ($1, '14:00', '17:00')`,
      [wd]
    );
  }
  await db.query(
    `INSERT INTO availability (weekday, start_time, end_time) VALUES (6, '09:00', '12:00')`
  );
  console.log(
    "Horaires par défaut ajoutés (lun–ven 9h–12h et 14h–17h, sam 9h–12h)."
  );
}

async function seedDemo(adminId) {
  const exists = await db.one(
    `SELECT id FROM users WHERE email = 'sarah.demo@velona.test'`
  );
  if (exists) {
    console.log("Données de démonstration déjà présentes.");
    return;
  }
  await seedMeals();
  await seedHours();
  const meals = await db.many("SELECT id, meal_type FROM meals");
  const byType = (t) => meals.filter((m) => m.meal_type === t).map((m) => m.id);
  const today = todayLocal();
  const ws = mondayOf(today);
  const people = [
    {
      first: "Sarah",
      last: "Rasoanaivo",
      email: "sarah.demo@velona.test",
      quartier: "Ivandry",
      kind: "90",
      start: 78,
      target: 70,
      weeks: 8,
      drift: -0.55,
      formula: "equilibre",
      conditions: ["surpoids"],
    },
    {
      first: "Jean-Marc",
      last: "Andriamasy",
      email: "jeanmarc.demo@velona.test",
      quartier: "Analakely",
      kind: "90",
      start: 92,
      target: 85,
      weeks: 6,
      drift: -0.4,
      formula: "serenite",
      conditions: ["diabete"],
      glucose: true,
    },
    {
      first: "Lova",
      last: "Rakoto",
      email: "lova.demo@velona.test",
      quartier: "Ambatobe",
      kind: "30",
      start: 64,
      target: 61,
      weeks: 3,
      drift: -0.3,
      formula: "essentiel",
      conditions: [],
    },
    {
      first: "Claire",
      last: "Dupont",
      email: "claire.demo@velona.test",
      quartier: "Ankorondrano",
      kind: "60",
      start: 71,
      target: 66,
      weeks: 4,
      drift: 0.3,
      formula: null,
      conditions: ["grossesse"],
      silent: true,
    },
    {
      first: "Nantenaina",
      last: "Mamy",
      email: "nantenaina.demo@velona.test",
      quartier: "Ivandry",
      kind: "60",
      start: 83,
      target: 77,
      weeks: 5,
      drift: -0.5,
      formula: "equilibre",
      conditions: ["hypertension"],
    },
  ];
  const pwd = hashPassword("demo-velona-2026");
  for (const p of people) {
    await db.tx(async (t) => {
      const u = await t.one(
        `INSERT INTO users (role, email, phone, password_hash, first_name, last_name) VALUES ('client', $1, '+261 34 00 000 00', $2, $3, $4) RETURNING id`,
        [p.email, pwd, p.first, p.last]
      );
      const fields = ["weight", "waist", "energy", "sleep"].concat(
        p.glucose ? ["glucose"] : []
      );
      await t.query(
        `INSERT INTO client_profiles (user_id, quartier, address, conditions, checkin_fields, consent_at, reason, sex)
        VALUES ($1, $2, $3, $4, $5, now(), $6, $7)`,
        [
          u.id,
          p.quartier,
          `Lot démo, ${p.quartier}`,
          p.conditions,
          fields,
          "Démonstration",
          p.first === "Jean-Marc" || p.first === "Nantenaina" ? "M" : "F",
        ]
      );
      const start = addDays(ws, -7 * p.weeks);
      await t.query(
        `INSERT INTO programs (client_id, kind, start_date, end_date, goal_label, metric, start_value, target_value) VALUES ($1, $2, $3, $4, $5, 'weight', $6, $7)`,
        [
          u.id,
          p.kind,
          start,
          addDays(start, parseInt(p.kind, 10) - 1),
          `-${p.start - p.target} kg en ${p.kind} jours`,
          p.start,
          p.target,
        ]
      );
      await t.query(
        `INSERT INTO consultations (client_id, consulted_at, weight, height, waist, observations, conclusion, created_by) VALUES ($1, $2, $3, 165, 92, 'Données de démonstration', 'Programme ${p.kind} jours', $4)`,
        [u.id, start, p.start, adminId]
      );
      const lastWeek = p.silent ? p.weeks - 2 : p.weeks;
      for (let w = 1; w <= lastWeek; w++) {
        const weight =
          Math.round(
            (p.start + p.drift * w + (Math.random() - 0.5) * 0.3) * 10
          ) / 10;
        const glucose = p.glucose
          ? Math.round((1.35 - w * 0.03 + (w === lastWeek ? 0.2 : 0)) * 100) /
            100
          : null;
        await t.query(
          `INSERT INTO checkins (client_id, created_at, weight, waist, energy, sleep, glucose, reviewed_at) VALUES ($1, $2::timestamptz, $3, $4, $5, $6, $7, CASE WHEN $8 THEN now() END)`,
          [
            u.id,
            addDays(start, 7 * w) + "T08:00:00+03:00",
            weight,
            92 - w * 0.6,
            3 + (w % 3 === 0 ? 1 : 0),
            w % 2 ? "moyen" : "bon",
            glucose,
            w < lastWeek,
          ]
        );
      }
      const inv = await createInvoice(t, {
        client_id: u.id,
        label: `Programme ${p.kind} jours`,
        items: [
          { label: `Programme ${p.kind} jours (démo)`, amount_mga: 300000 },
        ],
        amount_mga: 300000,
      });
      if (p.first !== "Lova")
        await t.query(
          `UPDATE invoices SET status = 'payee', paid_at = $2::timestamptz, method = 'mvola' WHERE id = $1`,
          [inv.id, start + "T10:00:00+03:00"]
        );
      if (p.formula) {
        await t.query(
          `INSERT INTO meal_subscriptions (client_id, formula, address, quartier) VALUES ($1, $2, $3, $4)`,
          [u.id, p.formula, `Lot démo, ${p.quartier}`, p.quartier]
        );
        for (const week of [ws, addDays(ws, 7)]) {
          const items = [];
          for (let d = 0; d < 7; d++) {
            items.push({
              day: d,
              slot: "petit-dejeuner",
              meal_id: byType("petit-dejeuner")[d % 4],
            });
            items.push({
              day: d,
              slot: "dejeuner",
              meal_id: byType("dejeuner")[(d + u.id) % 6],
            });
            items.push({
              day: d,
              slot: "diner",
              meal_id: byType("diner")[(d + u.id) % 4],
            });
          }
          await t.query(
            "INSERT INTO menu_plans (client_id, week_start, items) VALUES ($1, $2, $3)",
            [u.id, week, JSON.stringify(items)]
          );
        }
      }
      await t.query(
        `INSERT INTO messages (client_id, sender_id, body, created_at) VALUES ($1, $1, 'Bonjour Annick, je me sens plus en forme cette semaine !', now() - interval '2 days')`,
        [u.id]
      );
    });
  }
  await generateOrders(ws);
  await generateOrders(addDays(ws, 7));
  await db.query(
    `INSERT INTO vitality_tests (first_name, contact, answers, score) VALUES ('Fara', 'fara@example.com', '[2,1,1,2,1,2,1,2,1,1,2,1]', 47), ('Tiana', '+261 32 00 000 00', '[3,2,2,3,2,3,2,2,2,2,3,2]', 72)`
  );
  console.log(
    "Clients de démonstration créés (mot de passe : demo-velona-2026)."
  );
}

async function main() {
  const args = process.argv.slice(2);
  await migrate({ quiet: true });
  let adminId = null;
  if (args.includes("--admin") || args.includes("--demo"))
    adminId = await seedAdmin();
  if (args.includes("--meals")) await seedMeals();
  if (args.includes("--hours")) await seedHours();
  if (args.includes("--demo")) await seedDemo(adminId);
  if (args.includes("--kitchen")) {
    const e = process.env.KITCHEN_EMAIL;
    const pw = process.env.KITCHEN_PASSWORD;
    if (
      e &&
      pw &&
      !(await db.one("SELECT id FROM users WHERE lower(email) = lower($1)", [
        e,
      ]))
    ) {
      await db.query(
        `INSERT INTO users (role, email, password_hash, first_name) VALUES ('kitchen', $1, $2, 'Cuisine')`,
        [e.toLowerCase(), hashPassword(pw)]
      );
      console.log("Compte cuisine créé :", e);
    }
  }
  await db.pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
