# Analyse du diagramme de classes — Projet UML Vélona (Phase 3)

## 1. Introduction

Ce document présente l'analyse des classes métier identifiées à partir du code source réel du projet Vélona. Les sources analysées sont :

- `server/migrations/001_init.sql` (schéma de base de données unique)
- `server/src/lib/domain.js` (règles métier)
- `server/src/lib/auth.js` (authentification et sessions)
- `server/src/routes/public.js` (routes publiques)
- `server/src/routes/client.js` (routes client)
- `server/src/routes/admin.js` (routes administratrice)
- `server/src/routes/kitchen.js` (routes cuisine)

Aucune classe, attribut ou relation n'a été inventé. Tous les éléments proviennent du code source.

---

## 2. Liste des classes identifiées

### 2.1 Classes métier (14 classes)

| #   | Classe               | Table/Source         | Justification                                                       |
| --- | -------------------- | -------------------- | ------------------------------------------------------------------- |
| 1   | **User**             | `users`              | Entité centrale : utilisateurs du système (clients, admin, cuisine) |
| 2   | **ClientProfile**    | `client_profiles`    | Fiche de renseignements du client (partie patient)                  |
| 3   | **VitalityTest**     | `vitality_tests`     | Test de vitalité (prospects et clients)                             |
| 4   | **Availability**     | `availability`       | Créneaux de disponibilité du praticien                              |
| 5   | **Appointment**      | `appointments`       | Rendez-vous (bilan ou suivi)                                        |
| 6   | **Consultation**     | `consultations`      | Fiche praticien après consultation                                  |
| 7   | **Program**          | `programs`           | Programme nutritionnel (30/60/90 jours)                             |
| 8   | **CheckIn**          | `checkins`           | Relevé de suivi client (poids, taille, énergie, etc.)               |
| 9   | **Meal**             | `meals`              | Bibliothèque de repas (recettes)                                    |
| 10  | **MenuPlan**         | `menu_plans`         | Menu de la semaine par client                                       |
| 11  | **MealSubscription** | `meal_subscriptions` | Abonnement aux repas livrés                                         |
| 12  | **MealOrder**        | `meal_orders`        | Commande de repas pour une date de livraison                        |
| 13  | **Message**          | `messages`           | Messagerie entre client et équipe                                   |
| 14  | **Invoice**          | `invoices`           | Facture (programme, repas, etc.)                                    |

### 2.2 Classes techniques / de support (3 classes)

| #   | Classe       | Table/Source | Justification                                          |
| --- | ------------ | ------------ | ------------------------------------------------------ |
| 15  | **Session**  | `sessions`   | Gestion des sessions authentifiées (jeton, expiration) |
| 16  | **Settings** | `settings`   | Paramètres système (clé/valeur JSON)                   |
| 17  | **EmailLog** | `email_log`  | Journal des emails envoyés                             |

**Total : 17 classes identifiées (14 métier + 3 techniques)**

---

## 3. Attributs et types par classe

### 3.1 User

| Attribut             | Type        | Contraintes                                     | Clé |
| -------------------- | ----------- | ----------------------------------------------- | --- |
| id                   | serial      | NOT NULL                                        | PK  |
| role                 | text        | NOT NULL, CHECK IN ('client','admin','kitchen') |     |
| email                | text        | NOT NULL, unique (lower)                        |     |
| phone                | text        |                                                 |     |
| password_hash        | text        | NOT NULL                                        |     |
| first_name           | text        | NOT NULL                                        |     |
| last_name            | text        | NOT NULL DEFAULT ''                             |     |
| active               | boolean     | NOT NULL DEFAULT true                           |     |
| must_change_password | boolean     | NOT NULL DEFAULT false                          |     |
| created_at           | timestamptz | NOT NULL DEFAULT now()                          |     |
| last_login_at        | timestamptz |                                                 |     |

**Clé étrangère :** aucune (c'est la table de référence)

**Méthodes métier (auth.js) :** `checkLogin(email, password)`, `publicUser(u)`, `createSession(res, userId)`, `destroySession(req, res)`, `loadUser(req)`, `requireAuth(...roles)`, `rateLimit(key, max, windowMs)`

---

### 3.2 ClientProfile

| Attribut         | Type        | Contraintes                                         | Clé           |
| ---------------- | ----------- | --------------------------------------------------- | ------------- |
| user_id          | int         | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE | PK, FK → User |
| birth_date       | date        |                                                     |               |
| sex              | text        |                                                     |               |
| nationality      | text        |                                                     |               |
| quartier         | text        |                                                     |               |
| address          | text        |                                                     |               |
| occupation       | text        |                                                     |               |
| activity_level   | text        |                                                     |               |
| follow_channel   | text        |                                                     |               |
| family_status    | text        |                                                     |               |
| household_size   | int         |                                                     |               |
| who_cooks        | text        |                                                     |               |
| food_budget      | text        |                                                     |               |
| reason           | text        |                                                     |               |
| conditions       | text[]      | NOT NULL DEFAULT '{}'                               |               |
| condition_other  | text        |                                                     |               |
| medication       | text        |                                                     |               |
| allergies        | text        |                                                     |               |
| forbidden_foods  | text        |                                                     |               |
| forbidden_reason | text        |                                                     |               |
| habits           | jsonb       | NOT NULL DEFAULT '{}'::jsonb                        |               |
| expectations     | text        |                                                     |               |
| goals            | text        |                                                     |               |
| meal_interest    | text        |                                                     |               |
| source           | text        |                                                     |               |
| checkin_fields   | text[]      | NOT NULL DEFAULT '{weight,waist,energy,sleep}'      |               |
| consent_at       | timestamptz |                                                     |               |
| last_reminder_at | timestamptz |                                                     |               |
| updated_at       | timestamptz | NOT NULL DEFAULT now()                              |               |

**Valeurs énumérées (conditions) :** diabete, hypertension, surpoids, digestif, grossesse, cholesterol, anemie, autre (source: client.js, ligne 14)

**Méthodes métier :** `cleanProfile(b)`, `updateProfile(userId, data)` (source: client.js)

---

### 3.3 VitalityTest

| Attribut   | Type        | Contraintes                             | Clé                   |
| ---------- | ----------- | --------------------------------------- | --------------------- |
| id         | serial      | PRIMARY KEY                             | PK                    |
| user_id    | int         | REFERENCES users(id) ON DELETE SET NULL | FK → User (optionnel) |
| first_name | text        |                                         |                       |
| contact    | text        |                                         |                       |
| answers    | jsonb       | NOT NULL                                |                       |
| score      | int         | NOT NULL                                |                       |
| converted  | boolean     | NOT NULL DEFAULT false                  |                       |
| created_at | timestamptz | NOT NULL DEFAULT now()                  |                       |

**Méthodes métier :** aucune méthode dédiée dans domain.js ; géré directement via SQL dans public.js

---

### 3.4 Availability

| Attribut   | Type   | Contraintes                                    | Clé |
| ---------- | ------ | ---------------------------------------------- | --- |
| id         | serial | PRIMARY KEY                                    | PK  |
| weekday    | int    | NOT NULL, CHECK BETWEEN 0 AND 6 (0 = dimanche) |     |
| start_time | time   | NOT NULL                                       |     |
| end_time   | time   | NOT NULL                                       |     |

**Méthodes métier :** aucune méthode dédiée ; géré via SQL dans admin.js

---

### 3.5 Appointment

| Attribut      | Type        | Contraintes                                                                    | Clé       |
| ------------- | ----------- | ------------------------------------------------------------------------------ | --------- |
| id            | serial      | PRIMARY KEY                                                                    | PK        |
| client_id     | int         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE                               | FK → User |
| starts_at     | timestamptz | NOT NULL                                                                       |           |
| duration_min  | int         | NOT NULL DEFAULT 60                                                            |           |
| format        | text        | NOT NULL DEFAULT 'cabinet', CHECK IN ('cabinet','visio')                       |           |
| kind          | text        | NOT NULL DEFAULT 'bilan', CHECK IN ('bilan','suivi')                           |           |
| status        | text        | NOT NULL DEFAULT 'confirme', CHECK IN ('confirme','termine','annule','absent') |           |
| client_note   | text        |                                                                                |           |
| reminder_sent | boolean     | NOT NULL DEFAULT false                                                         |           |
| created_at    | timestamptz | NOT NULL DEFAULT now()                                                         |           |

**Index unique :** `appointments_slot_uq` ON (starts_at) WHERE status <> 'annule'

**Méthodes métier :** aucune méthode dédiée dans domain.js ; géré via SQL dans public.js, client.js, admin.js

---

### 3.6 Consultation

| Attribut           | Type         | Contraintes                                      | Clé                          |
| ------------------ | ------------ | ------------------------------------------------ | ---------------------------- |
| id                 | serial       | PRIMARY KEY                                      | PK                           |
| client_id          | int          | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | FK → User                    |
| appointment_id     | int          | REFERENCES appointments(id) ON DELETE SET NULL   | FK → Appointment (optionnel) |
| consulted_at       | date         | NOT NULL DEFAULT current_date                    |                              |
| weight             | numeric(5,1) |                                                  |                              |
| height             | numeric(5,1) |                                                  |                              |
| waist              | numeric(5,1) |                                                  |                              |
| hip                | numeric(5,1) |                                                  |                              |
| bp                 | text         |                                                  |                              |
| hr                 | int          |                                                  |                              |
| fat_pct            | numeric(4,1) |                                                  |                              |
| muac               | text         |                                                  |                              |
| peds               | jsonb        | NOT NULL DEFAULT '{}'::jsonb                     |                              |
| glucose            | text         |                                                  |                              |
| albumin            | text         |                                                  |                              |
| cholesterol        | text         |                                                  |                              |
| triglycerides      | text         |                                                  |                              |
| hemoglobin         | text         |                                                  |                              |
| bio_date           | date         |                                                  |                              |
| other_tests        | text         |                                                  |                              |
| observations       | text         |                                                  |                              |
| assessment         | text         |                                                  |                              |
| conclusion         | text         |                                                  |                              |
| program_prescribed | text         |                                                  |                              |
| meals_prescribed   | text         |                                                  |                              |
| next_appointment   | date         |                                                  |                              |
| fee                | text         |                                                  |                              |
| internal_notes     | text         |                                                  |                              |
| created_by         | int          | REFERENCES users(id)                             | FK → User (créateur)         |
| created_at         | timestamptz  | NOT NULL DEFAULT now()                           |                              |
| updated_at         | timestamptz  | NOT NULL DEFAULT now()                           |                              |

**Méthodes métier :** `cleanConsultation(b)` (source: admin.js, ligne 18)

---

### 3.7 Program

| Attribut     | Type         | Contraintes                                                             | Clé       |
| ------------ | ------------ | ----------------------------------------------------------------------- | --------- |
| id           | serial       | PRIMARY KEY                                                             | PK        |
| client_id    | int          | NOT NULL, REFERENCES users(id) ON DELETE CASCADE                        | FK → User |
| kind         | text         | NOT NULL, CHECK IN ('30','60','90')                                     |           |
| start_date   | date         | NOT NULL                                                                |           |
| end_date     | date         | NOT NULL                                                                |           |
| goal_label   | text         | NOT NULL                                                                |           |
| metric       | text         | NOT NULL DEFAULT 'weight', CHECK IN ('weight','waist','glucose')        |           |
| start_value  | numeric(6,2) |                                                                         |           |
| target_value | numeric(6,2) |                                                                         |           |
| status       | text         | NOT NULL DEFAULT 'actif', CHECK IN ('actif','termine','pause','annule') |           |
| created_at   | timestamptz  | NOT NULL DEFAULT now()                                                  |           |

**Méthodes métier :** `activeProgram(clientId)`, `progress(program, checkins)` (source: client.js)

---

### 3.8 CheckIn

| Attribut    | Type         | Contraintes                                      | Clé       |
| ----------- | ------------ | ------------------------------------------------ | --------- |
| id          | serial       | PRIMARY KEY                                      | PK        |
| client_id   | int          | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | FK → User |
| created_at  | timestamptz  | NOT NULL DEFAULT now()                           |           |
| weight      | numeric(5,1) |                                                  |           |
| waist       | numeric(5,1) |                                                  |           |
| energy      | int          | CHECK BETWEEN 1 AND 5                            |           |
| sleep       | text         | CHECK IN ('faible','moyen','bon')                |           |
| glucose     | numeric(5,2) |                                                  |           |
| bp          | text         |                                                  |           |
| note        | text         |                                                  |           |
| photo       | text         |                                                  |           |
| reviewed_at | timestamptz  |                                                  |           |
| review_note | text         |                                                  |           |

**Méthodes métier :** `progress(program, checkins)` utilise les checkins (source: client.js)

---

### 3.9 Meal

| Attribut    | Type        | Contraintes                                                          | Clé |
| ----------- | ----------- | -------------------------------------------------------------------- | --- |
| id          | serial      | PRIMARY KEY                                                          | PK  |
| name        | text        | NOT NULL                                                             |     |
| description | text        |                                                                      |     |
| meal_type   | text        | NOT NULL, CHECK IN ('petit-dejeuner','dejeuner','diner','collation') |     |
| tags        | text[]      | NOT NULL DEFAULT '{}'                                                |     |
| profiles    | text[]      | NOT NULL DEFAULT '{}'                                                |     |
| ingredients | jsonb       | NOT NULL DEFAULT '[]'::jsonb                                         |     |
| active      | boolean     | NOT NULL DEFAULT true                                                |     |
| created_at  | timestamptz | NOT NULL DEFAULT now()                                               |     |

**Méthodes métier :** `cleanMeal(b)` (source: admin.js, ligne 247), `shoppingList(from, to)` utilise les repas (source: domain.js)

---

### 3.10 MenuPlan

| Attribut   | Type        | Contraintes                                      | Clé       |
| ---------- | ----------- | ------------------------------------------------ | --------- |
| id         | serial      | PRIMARY KEY                                      | PK        |
| client_id  | int         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | FK → User |
| week_start | date        | NOT NULL                                         |           |
| items      | jsonb       | NOT NULL DEFAULT '[]'::jsonb                     |           |
| note       | text        |                                                  |           |
| updated_at | timestamptz | NOT NULL DEFAULT now()                           |           |

**Contrainte :** UNIQUE (client_id, week_start)

**Items JSON :** [{ day: 0..6, slot, meal_id }] (0 = lundi)

**Méthodes métier :** `menuWithMeals(clientId, weekStart)` (source: client.js)

---

### 3.11 MealSubscription

| Attribut      | Type        | Contraintes                                                   | Clé           |
| ------------- | ----------- | ------------------------------------------------------------- | ------------- |
| client_id     | int         | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE           | PK, FK → User |
| formula       | text        | NOT NULL, CHECK IN ('essentiel','equilibre','serenite')       |               |
| delivery_days | text[]      | NOT NULL DEFAULT '{lundi,jeudi}'                              |               |
| address       | text        |                                                               |               |
| quartier      | text        |                                                               |               |
| instructions  | text        |                                                               |               |
| status        | text        | NOT NULL DEFAULT 'actif', CHECK IN ('actif','pause','arrete') |               |
| started_at    | date        | NOT NULL DEFAULT current_date                                 |               |
| updated_at    | timestamptz | NOT NULL DEFAULT now()                                        |               |

**Formules (domain.js, ligne 41-45) :**

- essentiel : 5 repas/semaine, jours [0-4], slot [dejeuner]
- equilibre : 10 repas/semaine, jours [0-4], slots [dejeuner, diner]
- serenite : 14 repas/semaine, jours [0-6], slots [dejeuner, diner]

**Méthodes métier :** `generateOrders(weekStart)` utilise les abonnements (source: domain.js)

---

### 3.12 MealOrder

| Attribut      | Type        | Contraintes                                                                                     | Clé       |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------- | --------- |
| id            | serial      | PRIMARY KEY                                                                                     | PK        |
| client_id     | int         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE                                                | FK → User |
| delivery_date | date        | NOT NULL                                                                                        |           |
| items         | jsonb       | NOT NULL DEFAULT '[]'::jsonb                                                                    |           |
| status        | text        | NOT NULL DEFAULT 'a_preparer', CHECK IN ('a_preparer','pret','en_livraison','livre','incident') |           |
| address       | text        |                                                                                                 |           |
| quartier      | text        |                                                                                                 |           |
| instructions  | text        |                                                                                                 |           |
| incident_note | text        |                                                                                                 |           |
| created_at    | timestamptz | NOT NULL DEFAULT now()                                                                          |           |
| updated_at    | timestamptz | NOT NULL DEFAULT now()                                                                          |           |

**Contrainte :** UNIQUE (client_id, delivery_date)

**Items JSON :** [{ day, slot, meal_id, name }]

**Méthodes métier :** `generateOrders(weekStart)`, `shoppingList(from, to)` (source: domain.js)

---

### 3.13 Message

| Attribut   | Type        | Contraintes                                      | Clé                   |
| ---------- | ----------- | ------------------------------------------------ | --------------------- |
| id         | serial      | PRIMARY KEY                                      | PK                    |
| client_id  | int         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | FK → User             |
| sender_id  | int         | REFERENCES users(id) ON DELETE SET NULL          | FK → User (optionnel) |
| body       | text        | NOT NULL                                         |                       |
| photo      | text        |                                                  |                       |
| automatic  | boolean     | NOT NULL DEFAULT false                           |                       |
| created_at | timestamptz | NOT NULL DEFAULT now()                           |                       |
| read_at    | timestamptz |                                                  |                       |

**Méthodes métier :** aucune méthode dédiée ; géré via SQL dans client.js, admin.js, kitchen.js

---

### 3.14 Invoice

| Attribut    | Type        | Contraintes                                                                         | Clé       |
| ----------- | ----------- | ----------------------------------------------------------------------------------- | --------- |
| id          | serial      | PRIMARY KEY                                                                         | PK        |
| number      | text        | NOT NULL UNIQUE                                                                     |           |
| client_id   | int         | NOT NULL, REFERENCES users(id) ON DELETE RESTRICT                                   | FK → User |
| label       | text        | NOT NULL                                                                            |           |
| items       | jsonb       | NOT NULL DEFAULT '[]'::jsonb                                                        |           |
| amount_mga  | int         | NOT NULL CHECK >= 0                                                                 |           |
| status      | text        | NOT NULL DEFAULT 'en_attente', CHECK IN ('en_attente','declaree','payee','annulee') |           |
| method      | text        |                                                                                     |           |
| payment_ref | text        |                                                                                     |           |
| issued_at   | timestamptz | NOT NULL DEFAULT now()                                                              |           |
| due_date    | date        |                                                                                     |           |
| declared_at | timestamptz |                                                                                     |           |
| paid_at     | timestamptz |                                                                                     |           |

**Séquence :** `invoice_seq` pour la génération du numéro (format VEL-YYYY-NNNN)

**Méthodes métier :** `createInvoice(t, {client_id, label, items, amount_mga, due_days})` (source: domain.js)

---

### 3.15 Session (technique)

| Attribut   | Type        | Contraintes                                      | Clé       |
| ---------- | ----------- | ------------------------------------------------ | --------- |
| token_hash | text        | PRIMARY KEY                                      | PK        |
| user_id    | int         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | FK → User |
| expires_at | timestamptz | NOT NULL                                         |           |
| created_at | timestamptz | NOT NULL DEFAULT now()                           |           |

**Méthodes métier :** `createSession(res, userId)`, `destroySession(req, res)`, `loadUser(req)` (source: auth.js)

---

### 3.16 Settings (technique)

| Attribut | Type  | Contraintes | Clé |
| -------- | ----- | ----------- | --- |
| key      | text  | PRIMARY KEY | PK  |
| value    | jsonb | NOT NULL    |     |

**Méthodes métier :** `getSettings()`, `saveSettings(patch)` (source: domain.js)

---

### 3.17 EmailLog (technique)

| Attribut   | Type        | Contraintes            | Clé |
| ---------- | ----------- | ---------------------- | --- |
| id         | serial      | PRIMARY KEY            | PK  |
| to_addr    | text        | NOT NULL               |     |
| subject    | text        | NOT NULL               |     |
| status     | text        | NOT NULL               |     |
| error      | text        |                        |     |
| created_at | timestamptz | NOT NULL DEFAULT now() |     |

**Méthodes métier :** aucune ; géré via `notify()` dans mailer.js (non analysé)

---

## 4. Relations et cardinalités

### 4.1 Récapitulatif des relations

| #   | Relation                          | Cardinalité | Type                          | Clé étrangère                                   | Justification                                          |
| --- | --------------------------------- | ----------- | ----------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| R1  | User → Session                    | 1 : 0..\*   | Association                   | sessions.user_id → users(id)                    | Un utilisateur peut avoir plusieurs sessions actives   |
| R2  | User → ClientProfile              | 1 : 0..1    | Association (1-à-1 optionnel) | client_profiles.user_id → users(id)             | Un client a au plus une fiche de renseignements        |
| R3  | User → VitalityTest               | 1 : 0..\*   | Association                   | vitality_tests.user_id → users(id)              | Un utilisateur peut passer plusieurs tests de vitalité |
| R4  | User → Appointment                | 1 : 0..\*   | Association                   | appointments.client_id → users(id)              | Un client peut avoir plusieurs rendez-vous             |
| R5  | User → Consultation               | 1 : 0..\*   | Association                   | consultations.client_id → users(id)             | Un client peut avoir plusieurs consultations           |
| R6  | User → Consultation (créateur)    | 1 : 0..\*   | Association                   | consultations.created_by → users(id)            | Un praticien crée plusieurs consultations              |
| R7  | Appointment → Consultation        | 1 : 0..1    | Association (1-à-1 optionnel) | consultations.appointment_id → appointments(id) | Une consultation est liée à au plus un rendez-vous     |
| R8  | User → Program                    | 1 : 0..\*   | Association                   | programs.client_id → users(id)                  | Un client peut avoir plusieurs programmes              |
| R9  | User → CheckIn                    | 1 : 0..\*   | Association                   | checkins.client_id → users(id)                  | Un client peut avoir plusieurs check-ins               |
| R10 | User → MenuPlan                   | 1 : 0..\*   | Association                   | menu_plans.client_id → users(id)                | Un client peut avoir plusieurs menus (par semaine)     |
| R11 | User → MealSubscription           | 1 : 0..1    | Association (1-à-1 optionnel) | meal_subscriptions.client_id → users(id)        | Un client a au plus un abonnement repas                |
| R12 | User → MealOrder                  | 1 : 0..\*   | Association                   | meal_orders.client_id → users(id)               | Un client peut avoir plusieurs commandes de repas      |
| R13 | User → Message (client)           | 1 : 0..\*   | Association                   | messages.client_id → users(id)                  | Un client peut recevoir plusieurs messages             |
| R14 | User → Message (expéditeur)       | 1 : 0..\*   | Association                   | messages.sender_id → users(id)                  | Un utilisateur peut envoyer plusieurs messages         |
| R15 | User → Invoice                    | 1 : 0..\*   | Association                   | invoices.client_id → users(id)                  | Un client peut avoir plusieurs factures                |
| R16 | Meal → MenuPlan (via items JSON)  | 1 : 0..\*   | Association (via JSONB)       | menu_plans.items[].meal_id → meals.id           | Un repas peut apparaître dans plusieurs menus          |
| R17 | Meal → MealOrder (via items JSON) | 1 : 0..\*   | Association (via JSONB)       | meal_orders.items[].meal_id → meals.id          | Un repas peut apparaître dans plusieurs commandes      |

### 4.2 Détail des cardinalités

| Relation                   | Côté source | Côté cible | Justification                                                                           |
| -------------------------- | ----------- | ---------- | --------------------------------------------------------------------------------------- |
| User → Session             | 1           | 0..\*      | Un utilisateur peut avoir 0, 1 ou plusieurs sessions simultanées                        |
| User → ClientProfile       | 1           | 0..1       | Un client a au plus une fiche de renseignements (PK partagée)                           |
| User → VitalityTest        | 1           | 0..\*      | Un utilisateur peut passer plusieurs tests de vitalité (user_id nullable)               |
| User → Appointment         | 1           | 0..\*      | Un client peut prendre plusieurs rendez-vous                                            |
| User → Consultation        | 1           | 0..\*      | Un client peut avoir plusieurs consultations                                            |
| Appointment → Consultation | 1           | 0..1       | Une consultation est liée à au plus un rendez-vous (appointment_id nullable, SET NULL)  |
| User → Program             | 1           | 0..\*      | Un client peut avoir plusieurs programmes (actifs ou terminés)                          |
| User → CheckIn             | 1           | 0..\*      | Un client peut faire plusieurs check-ins                                                |
| User → MenuPlan            | 1           | 0..\*      | Un client peut avoir un menu par semaine (contrainte UNIQUE sur client_id + week_start) |
| User → MealSubscription    | 1           | 0..1       | Un client a au plus un abonnement repas (client_id est PK)                              |
| User → MealOrder           | 1           | 0..\*      | Un client peut avoir plusieurs commandes (une par date de livraison)                    |
| User → Message             | 1           | 0..\*      | Un client peut avoir plusieurs messages (client_id et sender_id)                        |
| User → Invoice             | 1           | 0..\*      | Un client peut avoir plusieurs factures                                                 |

---

## 5. Énumérations

| Énumération                  | Valeurs possibles                                                                                | Utilisée dans                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| User.role                    | 'client', 'admin', 'kitchen'                                                                     | users.role                                                    |
| Appointment.format           | 'cabinet', 'visio'                                                                               | appointments.format                                           |
| Appointment.kind             | 'bilan', 'suivi'                                                                                 | appointments.kind                                             |
| Appointment.status           | 'confirme', 'termine', 'annule', 'absent'                                                        | appointments.status                                           |
| Program.kind                 | '30', '60', '90'                                                                                 | programs.kind                                                 |
| Program.metric               | 'weight', 'waist', 'glucose'                                                                     | programs.metric                                               |
| Program.status               | 'actif', 'termine', 'pause', 'annule'                                                            | programs.status                                               |
| CheckIn.sleep                | 'faible', 'moyen', 'bon'                                                                         | checkins.sleep                                                |
| Meal.meal_type               | 'petit-dejeuner', 'dejeuner', 'diner', 'collation'                                               | meals.meal_type                                               |
| MealSubscription.formula     | 'essentiel', 'equilibre', 'serenite'                                                             | meal_subscriptions.formula                                    |
| MealSubscription.status      | 'actif', 'pause', 'arrete'                                                                       | meal_subscriptions.status                                     |
| MealOrder.status             | 'a_preparer', 'pret', 'en_livraison', 'livre', 'incident'                                        | meal_orders.status                                            |
| Invoice.status               | 'en_attente', 'declaree', 'payee', 'annulee'                                                     | invoices.status                                               |
| ClientProfile.conditions     | 'diabete', 'hypertension', 'surpoids', 'digestif', 'grossesse', 'cholesterol', 'anemie', 'autre' | client_profiles.conditions (text[], validé dans client.js)    |
| ClientProfile.checkin_fields | 'weight', 'waist', 'energy', 'sleep', 'glucose', 'bp'                                            | client_profiles.checkin_fields (text[], validé dans admin.js) |

**Total : 14 énumérations identifiées**

---

## 6. Justification des relations avec les fichiers sources

| Relation                            | Fichier source                                    | Preuve                                                              |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| R1 (User → Session)                 | `001_init.sql` ligne 19-23                        | `user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`       |
| R2 (User → ClientProfile)           | `001_init.sql` ligne 27-28                        | `user_id int PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`    |
| R3 (User → VitalityTest)            | `001_init.sql` ligne 59-61                        | `user_id int REFERENCES users(id) ON DELETE SET NULL`               |
| R4 (User → Appointment)             | `001_init.sql` ligne 77-79                        | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R5 (User → Consultation)            | `001_init.sql` ligne 93-96                        | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R6 (User → Consultation created_by) | `001_init.sql` ligne 122                          | `created_by int REFERENCES users(id)`                               |
| R7 (Appointment → Consultation)     | `001_init.sql` ligne 96                           | `appointment_id int REFERENCES appointments(id) ON DELETE SET NULL` |
| R8 (User → Program)                 | `001_init.sql` ligne 128-130                      | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R9 (User → CheckIn)                 | `001_init.sql` ligne 143-145                      | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R10 (User → MenuPlan)               | `001_init.sql` ligne 173-175                      | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R11 (User → MealSubscription)       | `001_init.sql` ligne 183-184                      | `client_id int PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`  |
| R12 (User → MealOrder)              | `001_init.sql` ligne 196-198                      | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R13 (User → Message client)         | `001_init.sql` ligne 212-214                      | `client_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE`     |
| R14 (User → Message sender)         | `001_init.sql` ligne 215                          | `sender_id int REFERENCES users(id) ON DELETE SET NULL`             |
| R15 (User → Invoice)                | `001_init.sql` ligne 225-228                      | `client_id int NOT NULL REFERENCES users(id) ON DELETE RESTRICT`    |
| R16 (Meal → MenuPlan)               | `001_init.sql` ligne 177 + domain.js ligne 64-101 | `items jsonb` contient des références à `meal_id`                   |
| R17 (Meal → MealOrder)              | `001_init.sql` ligne 200 + domain.js ligne 64-101 | `items jsonb` contient des références à `meal_id`                   |

**Logique métier supplémentaire (domain.js) :**

- `generateOrders(weekStart)` : relie MealSubscription → MenuPlan → MealOrder (ligne 64-101)
- `shoppingList(from, to)` : relie MealOrder → Meal (ligne 104-124)
- `createInvoice(...)` : crée une Invoice liée à un User (ligne 127-133)
- `computeAlerts()` : relie Program, CheckIn, Invoice, User (ligne 136-189)

---

## 7. Points ambigus ou à vérifier

1. **Tables de jointure implicites via JSONB** : Les relations entre Meal et MenuPlan / MealOrder sont stockées dans des colonnes JSONB (`items`), pas comme des clés étrangères SQL explicites. Ces relations sont logiques mais non contraintes au niveau base de données.

2. **VitalityTest sans user_id** : Un test de vitalité peut être créé sans utilisateur connecté (user_id NULL, ON DELETE SET NULL). Il s'agit d'un prospect non encore converti. La relation User → VitalityTest est donc 1 : 0..\* avec optionnalité du côté cible.

3. **Consultation sans appointment** : Une consultation peut exister sans rendez-vous associé (appointment_id NULL, ON DELETE SET NULL). La relation Appointment → Consultation est 1 : 0..1.

4. **Classes techniques vs métier** : Session, Settings et EmailLog sont des tables techniques. Elles ne représentent pas des entités métier du domaine nutrition mais supportent le fonctionnement de l'application.

5. **Pas de classe "Practitioner" séparée** : Le praticien (Annick) est modélisé comme un User avec role 'admin' ou 'kitchen'. Il n'existe pas de classe métier distincte pour le praticien.

6. **Pas de classe "Payment" séparée** : Les paiements sont gérés via les champs `method`, `payment_ref`, `status` dans la table Invoice. Il n'existe pas de classe Payment indépendante.

7. **checkin_fields dans ClientProfile** : Ce champ définit quels champs sont affichés dans le check-in du client. C'est une configuration par client, pas une entité séparée.

8. **Pas de contrainte d'unicité sur (client_id, week_start) pour MenuPlan** : Cette contrainte existe (ligne 180 de 001_init.sql), garantissant un menu par semaine par client.

9. **ON DELETE RESTRICT sur Invoice.client_id** : Une facture ne peut pas être supprimée si le client existe encore, empêchant la suppression accidentelle de clients ayant des factures.

---

## 8. Bilan

| Élément                        | Nombre |
| ------------------------------ | ------ |
| Classes métier identifiées     | 14     |
| Classes techniques identifiées | 3      |
| **Total des classes**          | **17** |
| Relations identifiées          | 17     |
| Énumérations identifiées       | 14     |

### Classes métier (14) :

User, ClientProfile, VitalityTest, Availability, Appointment, Consultation, Program, CheckIn, Meal, MenuPlan, MealSubscription, MealOrder, Message, Invoice

### Classes techniques (3) :

Session, Settings, EmailLog

### Relations (17) :

R1 à R17 comme détaillées dans la section 4

### Énumérations (14) :

User.role, Appointment.format, Appointment.kind, Appointment.status, Program.kind, Program.metric, Program.status, CheckIn.sleep, Meal.meal_type, MealSubscription.formula, MealSubscription.status, MealOrder.status, Invoice.status, ClientProfile.conditions
