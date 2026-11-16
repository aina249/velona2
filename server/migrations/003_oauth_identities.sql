-- Connexions sociales : seules les identités et états éphémères sont stockés.
-- Les jetons Google / Facebook ne sont jamais enregistrés en base.

CREATE TABLE oauth_identities (
  provider         text NOT NULL CHECK (provider IN ('google', 'facebook')),
  provider_subject text NOT NULL,
  user_id          int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_used_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_subject)
);
CREATE INDEX oauth_identities_user_idx ON oauth_identities (user_id);

CREATE TABLE oauth_states (
  state_hash text PRIMARY KEY,
  provider   text NOT NULL CHECK (provider IN ('google', 'facebook')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX oauth_states_expiry_idx ON oauth_states (expires_at);
