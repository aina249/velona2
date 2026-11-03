-- Vélona — schéma initial

CREATE TABLE users (
  id            serial PRIMARY KEY,
  role          text NOT NULL CHECK (role IN ('client', 'admin', 'kitchen')),
  email         text NOT NULL,
  phone         text,
  password_hash text NOT NULL,
  first_name    text NOT NULL,
  last_name     text NOT NULL DEFAULT '',
  active        boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE UNIQUE INDEX users_email_uq ON users (lower(email));

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id    int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- Fiche de renseignements (partie remplie par le client ou avec Annick)
CREATE TABLE client_profiles (
  user_id         int PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_date      date,
  sex             text,
  nationality     text,
  quartier        text,
  address         text,
  occupation      text,
  activity_level  text,
  follow_channel  text,
  family_status   text,
  household_size  int,
  who_cooks       text,
  food_budget     text,
  reason          text,
  conditions      text[] NOT NULL DEFAULT '{}',
  condition_other text,
  medication      text,
  allergies       text,
  forbidden_foods text,
  forbidden_reason text,
  habits          jsonb NOT NULL DEFAULT '{}'::jsonb,
  expectations    text,
  goals           text,
  meal_interest   text,
  source          text,
  checkin_fields  text[] NOT NULL DEFAULT '{weight,waist,energy,sleep}',
  consent_at      timestamptz,
  last_reminder_at timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vitality_tests (
  id         serial PRIMARY KEY,
  user_id    int REFERENCES users(id) ON DELETE SET NULL,
  first_name text,
  contact    text,
  answers    jsonb NOT NULL,
  score      int NOT NULL,
  converted  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE availability (
  id         serial PRIMARY KEY,
  weekday    int NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = dimanche
  start_time time NOT NULL,
  end_time   time NOT NULL
);

CREATE TABLE appointments (
  id           serial PRIMARY KEY,
  client_id    int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 60,
  format       text NOT NULL DEFAULT 'cabinet' CHECK (format IN ('cabinet', 'visio')),
  kind         text NOT NULL DEFAULT 'bilan' CHECK (kind IN ('bilan', 'suivi')),
  status       text NOT NULL DEFAULT 'confirme' CHECK (status IN ('confirme', 'termine', 'annule', 'absent')),
  client_note  text,
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX appointments_slot_uq ON appointments (starts_at) WHERE status <> 'annule';
CREATE INDEX appointments_client_idx ON appointments (client_id);

-- Partie praticien de la fiche
CREATE TABLE consultations (
  id               serial PRIMARY KEY,
  client_id        int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id   int REFERENCES appointments(id) ON DELETE SET NULL,
  consulted_at     date NOT NULL DEFAULT current_date,
  weight           numeric(5,1),
  height           numeric(5,1),
  waist            numeric(5,1),
  hip              numeric(5,1),
  bp               text,
  hr               int,
  fat_pct          numeric(4,1),
  muac             text,
  peds             jsonb NOT NULL DEFAULT '{}'::jsonb,
  glucose          text,
  albumin          text,
  cholesterol      text,
  triglycerides    text,
  hemoglobin       text,
  bio_date         date,
  other_tests      text,
  observations     text,
  assessment       text,
  conclusion       text,
  program_prescribed text,
  meals_prescribed text,
  next_appointment date,
  fee              text,
  internal_notes   text,
  created_by       int REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consultations_client_idx ON consultations (client_id);

CREATE TABLE programs (
  id           serial PRIMARY KEY,
  client_id    int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('30', '60', '90')),
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  goal_label   text NOT NULL,
  metric       text NOT NULL DEFAULT 'weight' CHECK (metric IN ('weight', 'waist', 'glucose')),
  start_value  numeric(6,2),
  target_value numeric(6,2),
  status       text NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'termine', 'pause', 'annule')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX programs_client_idx ON programs (client_id);

CREATE TABLE checkins (
  id          serial PRIMARY KEY,
  client_id   int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  weight      numeric(5,1),
  waist       numeric(5,1),
  energy      int CHECK (energy BETWEEN 1 AND 5),
  sleep       text CHECK (sleep IN ('faible', 'moyen', 'bon')),
  glucose     numeric(5,2),
  bp          text,
  note        text,
  photo       text,
  reviewed_at timestamptz,
  review_note text
);
CREATE INDEX checkins_client_idx ON checkins (client_id, created_at DESC);

CREATE TABLE meals (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  description text,
  meal_type   text NOT NULL CHECK (meal_type IN ('petit-dejeuner', 'dejeuner', 'diner', 'collation')),
  tags        text[] NOT NULL DEFAULT '{}',
  profiles    text[] NOT NULL DEFAULT '{}',
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Menus de la semaine par client. items : [{ day: 0..6 (0 = lundi), slot, meal_id }]
CREATE TABLE menu_plans (
  id         serial PRIMARY KEY,
  client_id  int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  note       text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, week_start)
);

CREATE TABLE meal_subscriptions (
  client_id     int PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  formula       text NOT NULL CHECK (formula IN ('essentiel', 'equilibre', 'serenite')),
  delivery_days text[] NOT NULL DEFAULT '{lundi,jeudi}',
  address       text,
  quartier      text,
  instructions  text,
  status        text NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'pause', 'arrete')),
  started_at    date NOT NULL DEFAULT current_date,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- items : [{ day, slot, meal_id, name }]
CREATE TABLE meal_orders (
  id            serial PRIMARY KEY,
  client_id     int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  items         jsonb NOT NULL DEFAULT '[]'::jsonb,
  status        text NOT NULL DEFAULT 'a_preparer' CHECK (status IN ('a_preparer', 'pret', 'en_livraison', 'livre', 'incident')),
  address       text,
  quartier      text,
  instructions  text,
  incident_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, delivery_date)
);
CREATE INDEX meal_orders_date_idx ON meal_orders (delivery_date);

CREATE TABLE messages (
  id         serial PRIMARY KEY,
  client_id  int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id  int REFERENCES users(id) ON DELETE SET NULL,
  body       text NOT NULL,
  photo      text,
  automatic  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at    timestamptz
);
CREATE INDEX messages_client_idx ON messages (client_id, created_at);

CREATE SEQUENCE invoice_seq;
CREATE TABLE invoices (
  id          serial PRIMARY KEY,
  number      text NOT NULL UNIQUE,
  client_id   int NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  label       text NOT NULL,
  items       jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_mga  int NOT NULL CHECK (amount_mga >= 0),
  status      text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'declaree', 'payee', 'annulee')),
  method      text,
  payment_ref text,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  due_date    date,
  declared_at timestamptz,
  paid_at     timestamptz
);
CREATE INDEX invoices_client_idx ON invoices (client_id);

CREATE TABLE settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE email_log (
  id         serial PRIMARY KEY,
  to_addr    text NOT NULL,
  subject    text NOT NULL,
  status     text NOT NULL,
  error      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
