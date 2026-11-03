# Vélona — plateforme web (V1)

Application web installable (PWA) pour Vélona, nutrition & hygiène de vie à Antananarivo.
Trois espaces dans une seule application :

| Espace | Adresse | Pour qui |
|---|---|---|
| **Espace client** | `/app` | Les clients : test de vitalité, inscription, rendez-vous, check-in hebdomadaire, courbes, menus, repas livrés, messagerie, factures, fiche de renseignements |
| **Cockpit** | `/cockpit` | Annick : tableau de bord, alertes, dossiers clients, fiche de consultation, programmes, menus, agenda, check-ins, messagerie, facturation, prospects, paramètres |
| **Cuisine** | `/cuisine` | Équipe cuisine et livraison : production du jour, liste de courses, étiquettes, feuille de route |

Le test de vitalité public est à l'adresse `/test` : c'est le lien à mettre sur le site et sur les réseaux sociaux.

---

## 1. Technique en bref

- **Serveur** : Node.js 20+ **sans aucune dépendance d'exécution** (HTTP, sécurité, connecteur PostgreSQL et envoi d'e-mails écrits en Node pur). Si le paquet `pg` est installé, il est utilisé automatiquement à la place du connecteur intégré.
- **Base de données** : PostgreSQL 14 ou plus récent.
- **Interface** : React 19, compilée avec esbuild en fichiers statiques servis par le serveur Node. Installable sur téléphone (« Ajouter à l'écran d'accueil »), fonctionne avec une connexion instable.
- **Sécurité** : mots de passe hachés (scrypt), sessions en base (cookie HttpOnly, révocables), protection CSRF, en-têtes de sécurité (CSP), limitation des tentatives de connexion, contrôle d'accès par rôle (client / admin / cuisine), photos vérifiées et servies uniquement à leur propriétaire et à l'équipe. Les données de l'API ne sont jamais mises en cache sur le téléphone.

```
velona/
├── server/            API + fichiers statiques
│   ├── src/
│   │   ├── index.js           démarrage, rappels automatiques
│   │   ├── migrate.js         migrations SQL
│   │   ├── seed.js            comptes et données initiales
│   │   ├── lib/               connecteur PostgreSQL, HTTP, auth, e-mails, règles métier
│   │   └── routes/            public, client, admin (cockpit), cuisine
│   ├── migrations/001_init.sql
│   └── test/api.test.js       30 tests de bout en bout
├── client/            interface React
│   ├── src/pages/{public,client,admin,kitchen,shared}
│   ├── static/        logo, icônes, manifeste PWA
│   └── build.js       compile vers server/public
├── Dockerfile, docker-compose.yml, Caddyfile.example
```

---

## 2. Installation sur un serveur (Ubuntu / Debian)

### a. Prérequis

```bash
sudo apt install -y postgresql
# Node.js 22 : https://nodejs.org (ou via nvm)
```

### b. Base de données

```bash
sudo -u postgres psql -c "CREATE USER velona WITH PASSWORD 'MOT_DE_PASSE_FORT';"
sudo -u postgres createdb -O velona velona
```

### c. Application

```bash
cd velona
npm run install:all          # installe esbuild + React (client) et pg (serveur, facultatif)
npm run build                # compile l'interface dans server/public
cp server/.env.example server/.env
nano server/.env             # renseigner DATABASE_URL, APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD…
cd server
npm run migrate              # crée les tables
npm run seed:admin           # crée le compte d'Annick + 16 plats de départ + horaires par défaut
npm run seed:kitchen         # (facultatif) compte cuisine
npm start                    # http://localhost:3000
```

### d. Lancement permanent (systemd)

`/etc/systemd/system/velona.service` :

```ini
[Unit]
Description=Vélona
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/velona/server
ExecStart=/usr/bin/node src/index.js
Restart=always
User=velona
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now velona
```

### e. HTTPS (obligatoire)

Placez l'application derrière **Caddy** (certificat automatique, voir `Caddyfile.example`) ou Nginx. Mettez `COOKIE_SECURE=true` dans `.env`. L'installation sur téléphone et le mode hors ligne exigent HTTPS.

### Variante Docker

```bash
echo "DB_PASSWORD=MOT_DE_PASSE_FORT" > .env
cp server/.env.example server/.env    # puis compléter
docker compose up -d --build
docker compose exec app node src/seed.js --admin --meals --hours
```

---

## 3. Sauvegardes (à mettre en place dès le premier client)

Ce sont des **données de santé** : la sauvegarde quotidienne est indispensable.

```bash
# /etc/cron.daily/velona-backup
pg_dump -U velona velona | gzip > /var/backups/velona/db-$(date +%F).sql.gz
tar czf /var/backups/velona/uploads-$(date +%F).tar.gz /var/lib/velona/uploads
find /var/backups/velona -mtime +30 -delete
```

Copiez aussi ces sauvegardes hors du serveur (autre machine ou stockage chiffré).

---

## 4. Premiers pas dans le cockpit

1. **Paramètres → Tarifs** : saisir les prix en Ariary (bilan, programmes, formules repas).
2. **Paramètres → Paiement** : numéros MVola / Orange Money / Airtel Money affichés aux clients.
3. **Paramètres → Livraison & agenda** : jours de livraison, quartiers desservis, durée des créneaux.
4. **Agenda → Mes horaires** : plages de consultation (les clients réservent dedans).
5. **Repas & menus** : vérifier et compléter les 16 plats de départ (ingrédients **par portion** : ils calculent la liste de courses).
6. **Paramètres → Équipe** : créer le compte de la personne en cuisine.

### Le cycle d'un client

1. Il fait le **test de vitalité**, crée son compte et **réserve son bilan**.
2. Pendant le bilan, Annick remplit la **consultation** (mesures, IMC et ratio calculés, bilan biologique, évaluation) puis crée le **programme** (30, 60 ou 90 jours, objectif chiffré) : la facture part automatiquement.
3. Annick compose ses **menus de la semaine** (onglet Menus du dossier, bouton « Copier la semaine précédente »).
4. Chaque semaine, le client fait son **check-in** ; Annick le consulte et répond, la réponse arrive dans sa messagerie.
5. S'il a une **formule repas**, la cuisine clique sur « Générer » : commandes, production, liste de courses, étiquettes (avec allergies) et feuille de route par quartier.
6. Le client paie par mobile money et touche **« J'ai payé »** avec la référence ; Annick **confirme** dans Facturation.

### Automatique

- Alertes du tableau de bord : client sans check-in depuis 10 jours, poids en hausse sur deux relevés, glycémie en hausse de plus de 10 %, paiement déclaré ou en retard, programme qui se termine (renouvellement).
- E-mails (si `SMTP_URL` est renseigné) : bienvenue, confirmation et rappel de rendez-vous la veille, rappel de check-in hebdomadaire, nouvelle facture, nouveau message. Historique dans Paramètres → E-mails.
- Réponse automatique à chaque premier message de la journée, rappelant de consulter un médecin en cas de symptôme.

---

## 5. Données de démonstration

```bash
npm run seed:demo     # 5 clients FICTIFS (mot de passe : demo-velona-2026), à ne PAS lancer en production
```

## 6. Tests

```bash
cd server && npm start &      # sur une base de démonstration
npm test                      # 30 tests : sécurité, inscription, check-in, rendez-vous, factures, menus, cuisine
```

---

## 7. Cadre légal à respecter

- Toute l'application parle de **nutrition et d'hygiène de vie**, jamais de diagnostic ni de prescription. Le titre affiché est « Nutritionniste » (modifiable dans Paramètres → Cabinet) : ne pas afficher « Dr » tant que l'inscription à l'Ordre n'est pas obtenue.
- Le consentement est recueilli à l'inscription (date enregistrée).
- Faire relire les conditions générales et la politique de confidentialité par un juriste malgache (loi n° 2014-038 sur la protection des données personnelles).
- Conservation des repas : les étiquettes indiquent « au congélateur dès réception » pour les repas prévus 3 jours ou plus après la livraison. Faire valider ces règles d'hygiène par Annick.

## 8. Pistes pour la V2

- Paiement automatique MVola / Orange Money (API marchands, après ouverture des comptes).
- Notifications WhatsApp ou SMS.
- Réinitialisation du mot de passe par e-mail (aujourd'hui : Annick génère un mot de passe temporaire).
- Application Android (même API).
- Export PDF du plan alimentaire, programmes en ligne, ateliers.
