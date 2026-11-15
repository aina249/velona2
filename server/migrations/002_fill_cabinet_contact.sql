-- Renseigne les coordonnées publiques uniquement lorsqu'elles sont absentes.
-- Les valeurs déjà configurées par l'administration restent prioritaires.
INSERT INTO settings (key, value)
VALUES (
  'cabinet',
  '{
    "address": "Ivandry, Antananarivo",
    "whatsapp": "+261 38 08 320 20",
    "email": "randriamasinjakaandriniaina@gmail.com"
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = settings.value || jsonb_strip_nulls(
  jsonb_build_object(
    'address', CASE
      WHEN coalesce(btrim(settings.value->>'address'), '') = ''
      THEN 'Ivandry, Antananarivo'
      ELSE NULL
    END,
    'whatsapp', CASE
      WHEN coalesce(btrim(settings.value->>'whatsapp'), '') = ''
      THEN '+261 38 08 320 20'
      ELSE NULL
    END,
    'email', CASE
      WHEN coalesce(btrim(settings.value->>'email'), '') = ''
      THEN 'randriamasinjakaandriniaina@gmail.com'
      ELSE NULL
    END
  )
);
