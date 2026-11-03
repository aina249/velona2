import React, { useState } from 'react';
import { post, put } from '../../lib/api';
import { useLoad, SLOTS, slotLabel } from '../../lib/util';
import { Async, Badge, Button, Empty, Field, Input, Modal, PageHeader, Pills, Select, Tabs, Textarea, useSubmit, Notice } from '../../ui/kit';
import { Icon } from '../../ui/icons';

const PROFILES = [['poids', 'Perte de poids'], ['diabete', 'Diabète'], ['grossesse', 'Grossesse'], ['hypertension', 'Hypertension'], ['energie', 'Énergie']];

export default function Meals() {
  const state = useLoad('/admin/meals');
  const [type, setType] = useState('tous');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  return (
    <div className="page">
      <PageHeader title="Repas & menus" subtitle="Votre bibliothèque de plats, utilisée pour composer les menus de chaque client" actions={<Button icon="plus" onClick={() => setEdit({ name: '', description: '', meal_type: 'dejeuner', tags: [], profiles: [], ingredients: [{ name: '', qty: '', unit: 'g' }], active: true })}>Nouveau plat</Button>} />
      <Notice icon="leaf">Les menus se composent dans le dossier de chaque client (onglet Menus). Les ingrédients servent à calculer la liste de courses de la cuisine : indiquez-les <strong>pour une portion</strong>.</Notice>
      <div className="toolbar">
        <label className="search"><Icon name="search" size={18} /><input type="search" placeholder="Rechercher un plat…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un plat" /></label>
      </div>
      <Async state={state}>
        {({ meals }) => {
          const list = meals.filter((m) => (type === 'tous' || m.meal_type === type) && (!q || m.name.toLowerCase().includes(q.toLowerCase())));
          return (
            <div className="stack">
              <Tabs tabs={[['tous', 'Tous', meals.length], ...SLOTS.map((s) => [s.key, s.label, meals.filter((m) => m.meal_type === s.key).length])]} value={type} onChange={setType} />
              {list.length ? (
                <div className="meal-grid">
                  {list.map((m) => (
                    <button key={m.id} type="button" className={`meal-tile ${m.active ? '' : 'inactive'}`} onClick={() => setEdit({ ...m, ingredients: m.ingredients.length ? m.ingredients : [{ name: '', qty: '', unit: 'g' }] })}>
                      <span className={`meal-slot slot-${m.meal_type}`}>{slotLabel(m.meal_type)}</span>
                      <strong>{m.name}</strong>
                      {m.description ? <span className="muted small">{m.description}</span> : null}
                      <span className="muted small">{m.ingredients.length} ingrédient{m.ingredients.length > 1 ? 's' : ''}{!m.active ? ' · archivé' : ''}</span>
                      {m.tags.length ? <span className="tags">{m.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span> : null}
                    </button>
                  ))}
                </div>
              ) : <Empty icon="menu" title="Aucun plat" />}
            </div>
          );
        }}
      </Async>
      {edit ? <MealModal meal={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); state.reload(); }} /> : null}
    </div>
  );
}

function MealModal({ meal, onClose, onDone }) {
  const [m, setM] = useState({ ...meal, tagsText: (meal.tags || []).join(', ') });
  const setIng = (k, field, val) => setM({ ...m, ingredients: m.ingredients.map((x, j) => (j === k ? { ...x, [field]: val } : x)) });
  const { run, busy } = useSubmit(async (active) => {
    const body = {
      name: m.name, description: m.description, meal_type: m.meal_type, profiles: m.profiles, active: active === undefined ? m.active : active,
      tags: m.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      ingredients: m.ingredients.filter((i) => i.name && i.name.trim()).map((i) => ({ name: i.name.trim(), qty: i.qty === '' ? 0 : i.qty, unit: i.unit })),
    };
    if (m.id) await put(`/admin/meals/${m.id}`, body); else await post('/admin/meals', body);
    onDone();
  }, { success: 'Plat enregistré' });
  return (
    <Modal title={m.id ? 'Modifier le plat' : 'Nouveau plat'} wide onClose={onClose} footer={<>
      {m.id ? <Button variant="ghost" className="mr-auto" onClick={() => run(!m.active)}>{m.active ? 'Archiver' : 'Réactiver'}</Button> : null}
      <Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={busy} onClick={() => run()}>Enregistrer</Button>
    </>}>
      <div className="stack">
        <div className="grid-2">
          <Field label="Nom du plat"><Input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} autoFocus /></Field>
          <Field label="Type de repas"><Select options={SLOTS.map((s) => [s.key, s.label])} value={m.meal_type} onChange={(e) => setM({ ...m, meal_type: e.target.value })} /></Field>
        </div>
        <Field label="Description (visible par le client)"><Textarea rows={2} value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} /></Field>
        <Field label="Étiquettes" hint="Séparées par des virgules, ex. traditionnel, fibres"><Input value={m.tagsText} onChange={(e) => setM({ ...m, tagsText: e.target.value })} /></Field>
        <div className="field"><span className="label">Adapté aux profils</span><Pills multiple label="Profils" options={PROFILES} value={m.profiles || []} onChange={(v) => setM({ ...m, profiles: v })} /></div>
        <div className="field">
          <span className="label">Ingrédients pour une portion</span>
          {m.ingredients.map((i, k) => (
            <div key={k} className="ing-row">
              <Input aria-label="Ingrédient" placeholder="Ingrédient" value={i.name} onChange={(e) => setIng(k, 'name', e.target.value)} />
              <Input aria-label="Quantité" inputMode="decimal" placeholder="Qté" value={i.qty} onChange={(e) => setIng(k, 'qty', e.target.value)} />
              <Select aria-label="Unité" options={['g', 'ml', 'pièce', 'c. à soupe', 'c. à café']} value={i.unit} onChange={(e) => setIng(k, 'unit', e.target.value)} />
              <button type="button" className="icon-btn" aria-label="Supprimer l'ingrédient" onClick={() => setM({ ...m, ingredients: m.ingredients.filter((_, j) => j !== k) })}><Icon name="x" size={18} /></button>
            </div>
          ))}
          <Button variant="ghost" size="sm" icon="plus" className="self-start" onClick={() => setM({ ...m, ingredients: [...m.ingredients, { name: '', qty: '', unit: 'g' }] })}>Ajouter un ingrédient</Button>
        </div>
        {!m.active ? <Badge>Plat archivé : il n'apparaît plus dans les menus</Badge> : null}
      </div>
    </Modal>
  );
}
