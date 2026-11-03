import React from 'react';
import { CONDITIONS } from '../../lib/util';
import { Card, Field, Input, Pills, Select, Textarea } from '../../ui/kit';

// Partie « patient » de la fiche de renseignements (remplie par le client ou par Annick)
export default function ProfileForm({ value, onChange }) {
  const p = value;
  const set = (k) => (e) => onChange({ ...p, [k]: e && e.target ? e.target.value : e });
  const h = p.habits || {};
  const setH = (k) => (e) => onChange({ ...p, habits: { ...h, [k]: e && e.target ? e.target.value : e } });
  const meals = [
    ['breakfast', 'Petit-déjeuner', 'Ex. pain, café au lait'], ['snack_am', 'Collation du matin', 'Si applicable'],
    ['lunch', 'Déjeuner', 'Ex. riz, légumes, viande'], ['snack_pm', "Collation de l'après-midi", 'Si applicable'], ['dinner', 'Dîner', 'Ex. soupe, féculents'],
  ];
  return (
    <div className="stack">
      <Card title="Identité">
        <div className="grid-2">
          <Field label="Date de naissance"><Input type="date" value={p.birth_date} onChange={set('birth_date')} /></Field>
          <div className="field"><span className="label">Sexe</span><Pills label="Sexe" options={[['F', 'Féminin'], ['M', 'Masculin'], ['A', 'Autre']]} value={p.sex} onChange={set('sex')} /></div>
          <Field label="Nationalité"><Input value={p.nationality} onChange={set('nationality')} placeholder="Ex. malgache, française…" /></Field>
          <Field label="Profession"><Input value={p.occupation} onChange={set('occupation')} /></Field>
          <Field label="Quartier"><Input value={p.quartier} onChange={set('quartier')} placeholder="Ex. Ankadivato" /></Field>
          <Field label="Adresse"><Input value={p.address} onChange={set('address')} /></Field>
          <div className="field"><span className="label">Activité professionnelle</span><Pills label="Activité" options={[['sedentaire', 'Sédentaire'], ['debout', 'Debout'], ['physique', 'Physique']]} value={p.activity_level} onChange={set('activity_level')} /></div>
          <div className="field"><span className="label">Suivi préféré</span><Pills label="Suivi" options={[['whatsapp', 'WhatsApp'], ['visio', 'Visio'], ['cabinet', 'Au cabinet']]} value={p.follow_channel} onChange={set('follow_channel')} /></div>
          <Field label="Situation familiale"><Select placeholder="—" options={[['celibataire', 'Célibataire'], ['couple', 'En couple'], ['marie', 'Marié(e)'], ['parent_isole', 'Parent isolé']]} value={p.family_status} onChange={set('family_status')} /></Field>
          <Field label="Personnes au foyer"><Input type="number" min="1" max="30" value={p.household_size} onChange={set('household_size')} /></Field>
        </div>
      </Card>

      <Card title="Raison de la consultation et santé">
        <div className="stack">
          <Field label="Raison principale"><Textarea value={p.reason} onChange={set('reason')} placeholder="Ex. perte de poids, diabète, grossesse, mieux manger…" /></Field>
          <div className="field"><span className="label">Particularités de santé connues</span><Pills multiple label="Particularités" options={CONDITIONS} value={p.conditions || []} onChange={set('conditions')} /></div>
          {(p.conditions || []).includes('autre') ? <Field label="Préciser"><Input value={p.condition_other} onChange={set('condition_other')} /></Field> : null}
          <div className="grid-2">
            <Field label="Traitement en cours"><Textarea value={p.medication} onChange={set('medication')} placeholder="Médicaments, posologie" /></Field>
            <Field label="Allergies alimentaires"><Textarea value={p.allergies} onChange={set('allergies')} placeholder="Ex. arachides, lactose, gluten…" /></Field>
            <Field label="Aliments interdits"><Input value={p.forbidden_foods} onChange={set('forbidden_foods')} placeholder="Ex. porc, crustacés…" /></Field>
            <Field label="Raison de l'interdiction"><Input value={p.forbidden_reason} onChange={set('forbidden_reason')} placeholder="Religieuse, culturelle, médicale…" /></Field>
          </div>
        </div>
      </Card>

      <Card title="Habitudes alimentaires">
        <div className="stack">
          <div className="grid-2">
            <Field label="Aliments de base"><Input value={h.staples} onChange={setH('staples')} placeholder="Riz, manioc, pain…" /></Field>
            <Field label="Boissons habituelles"><Input value={h.drinks} onChange={setH('drinks')} placeholder="Eau, thé, café, sodas…" /></Field>
          </div>
          <div className="grid-2">
            <div className="field"><span className="label">Alcool</span><Pills label="Alcool" options={[['jamais', 'Jamais'], ['occasionnel', 'Occasionnel'], ['regulier', 'Régulier']]} value={h.alcohol} onChange={setH('alcohol')} /></div>
            <div className="field"><span className="label">Tabac</span><Pills label="Tabac" options={[['non', 'Non-fumeur'], ['ex', 'Ex-fumeur'], ['oui', 'Fumeur']]} value={h.tobacco} onChange={setH('tobacco')} /></div>
            <div className="field"><span className="label">Sommeil</span><Pills label="Sommeil" options={[['bon', 'Bon'], ['moyen', 'Moyen'], ['mauvais', 'Mauvais']]} value={h.sleep} onChange={setH('sleep')} /></div>
            <div className="field"><span className="label">Stress</span><Pills label="Stress" options={[['faible', 'Faible'], ['modere', 'Modéré'], ['eleve', 'Élevé']]} value={h.stress} onChange={setH('stress')} /></div>
            <div className="field"><span className="label">Qui cuisine ?</span><Pills label="Cuisine" options={[['moi', 'Moi-même'], ['autre', 'Une autre personne'], ['exterieur', 'Repas extérieurs']]} value={p.who_cooks} onChange={set('who_cooks')} /></div>
            <Field label="Budget alimentaire mensuel"><Input value={p.food_budget} onChange={set('food_budget')} placeholder="Ex. 400 000 MGA" /></Field>
          </div>
          <p className="label">Répartition des repas</p>
          <div className="meal-schedule">
            {meals.map(([k, l, ph]) => (
              <div key={k} className="meal-schedule-row">
                <span className="meal-schedule-label">{l}</span>
                <Input aria-label={`${l} : aliments`} value={h[k]} onChange={setH(k)} placeholder={ph} />
                <Input aria-label={`${l} : horaire`} type="time" value={h[k + '_time']} onChange={setH(k + '_time')} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Activité physique et objectifs">
        <div className="stack">
          <div className="field"><span className="label">Sport</span><Pills label="Sport" options={[['non', 'Non'], ['occasionnel', 'Occasionnel'], ['regulier', 'Régulier'], ['intensif', 'Intensif']]} value={h.sport} onChange={setH('sport')} /></div>
          <Field label="Type d'activité et fréquence"><Input value={h.sport_detail} onChange={setH('sport_detail')} placeholder="Ex. marche 3 fois par semaine" /></Field>
          <Field label="Vos attentes"><Textarea value={p.expectations} onChange={set('expectations')} /></Field>
          <Field label="Objectifs chiffrés"><Input value={p.goals} onChange={set('goals')} placeholder="Ex. perdre 6 kg en 3 mois" /></Field>
          <div className="field"><span className="label">Intéressé(e) par les repas livrés ?</span><Pills label="Repas livrés" options={[['oui', 'Oui'], ['non', 'Non'], ['info', 'Je veux en savoir plus']]} value={p.meal_interest} onChange={set('meal_interest')} /></div>
          <div className="field"><span className="label">Comment avez-vous connu Vélona ?</span><Pills label="Source" options={[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp'], ['bouche_a_oreille', 'Bouche à oreille'], ['autre', 'Autre']]} value={p.source} onChange={set('source')} /></div>
        </div>
      </Card>
    </div>
  );
}

// Champs envoyés à l'API (ignore les champs techniques)
export function profilePayload(p) {
  const keys = ['birth_date', 'sex', 'nationality', 'quartier', 'address', 'occupation', 'activity_level', 'follow_channel', 'family_status', 'household_size',
    'who_cooks', 'food_budget', 'reason', 'conditions', 'condition_other', 'medication', 'allergies', 'forbidden_foods', 'forbidden_reason', 'habits',
    'expectations', 'goals', 'meal_interest', 'source'];
  const out = {};
  for (const k of keys) if (p[k] !== undefined) out[k] = p[k] === '' ? null : p[k];
  return out;
}
