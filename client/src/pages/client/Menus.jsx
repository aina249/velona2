import React, { useEffect, useState } from 'react';
import { put } from '../../lib/api';
import { useLoad, todayStr, mondayOf, addDays, fmtShort, fmtDay, DAYS, SLOTS, FORMULA_LABELS, FORMULA_DESC, ORDER_STATUS, mga, slotLabel } from '../../lib/util';
import { Async, Button, Card, Empty, Field, Input, PageHeader, Pills, StatusBadge, Textarea, useSubmit, Notice, Badge } from '../../ui/kit';
import { Icon } from '../../ui/icons';

export function MenuWeek({ items, day, setDay }) {
  const byDay = items.filter((i) => i.day === day).sort((a, b) => SLOTS.findIndex((s) => s.key === a.slot) - SLOTS.findIndex((s) => s.key === b.slot));
  return (
    <>
      <div className="day-tabs" role="tablist">
        {DAYS.map((d, i) => (
          <button key={d} type="button" role="tab" aria-selected={day === i} className={`day-tab ${day === i ? 'on' : ''}`} onClick={() => setDay(i)}>
            {d.slice(0, 3)}{items.some((x) => x.day === i) ? <span className="dot" /> : null}
          </button>
        ))}
      </div>
      {byDay.length ? (
        <div className="stack">
          {byDay.map((i, k) => (
            <article key={k} className="meal-card fade-up" style={{ animationDelay: `${k * 60}ms` }}>
              <span className={`meal-slot slot-${i.slot}`}>{slotLabel(i.slot)}</span>
              <h3>{i.meal ? i.meal.name : 'Plat à définir'}</h3>
              {i.meal && i.meal.description ? <p className="muted">{i.meal.description}</p> : null}
              {i.meal && i.meal.tags && i.meal.tags.length ? <div className="tags">{i.meal.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div> : null}
            </article>
          ))}
        </div>
      ) : <Empty icon="menu" title="Rien de prévu ce jour" />}
    </>
  );
}

export default function Menus() {
  const [week, setWeek] = useState(mondayOf(todayStr()));
  const today = (new Date(todayStr() + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const [day, setDay] = useState(week === mondayOf(todayStr()) ? today : 0);
  const state = useLoad('/me/menu?week=' + week);
  return (
    <div className="page">
      <PageHeader title="Mes menus" subtitle="Préparés par Annick selon votre programme" />
      <div className="week-nav">
        <button type="button" className="icon-btn" aria-label="Semaine précédente" onClick={() => setWeek(addDays(week, -7))}><Icon name="back" /></button>
        <strong>Semaine du {fmtShort(week)} au {fmtShort(addDays(week, 6))}</strong>
        <button type="button" className="icon-btn" aria-label="Semaine suivante" onClick={() => setWeek(addDays(week, 7))}><Icon name="chevron" /></button>
      </div>
      <Async state={state}>
        {(d) => (d.items.length ? (
          <div className="stack">
            {d.note ? <Notice icon="message"><strong>Le mot d'Annick :</strong> {d.note}</Notice> : null}
            <MenuWeek items={d.items} day={day} setDay={setDay} />
          </div>
        ) : <Empty icon="menu" title="Pas encore de menu cette semaine">Annick prépare vos menus après votre bilan. Ils apparaîtront ici.</Empty>)}
      </Async>
    </div>
  );
}

export function Repas() {
  const state = useLoad('/me/meals');
  const [f, setF] = useState(null);
  const [editing, setEditing] = useState(false);
  const { run, busy } = useSubmit(async (status) => {
    const out = await put('/me/meals', { ...f, status: status || 'actif' });
    state.setData((d) => ({ ...d, subscription: out }));
    setEditing(false);
  }, { success: 'Votre formule est enregistrée' });

  useEffect(() => {
    if (state.data && !f) {
      const s = state.data.subscription;
      setF(s ? { formula: s.formula, delivery_days: s.delivery_days, address: s.address, quartier: s.quartier, instructions: s.instructions }
        : { formula: 'equilibre', delivery_days: state.data.delivery.days.length ? state.data.delivery.days : ['lundi', 'jeudi'], address: '', quartier: '', instructions: '' });
      setEditing(!s);
    }
  }, [state.data]);

  return (
    <div className="page">
      <PageHeader title="Repas livrés" subtitle="Préparés selon votre programme, livrés à Antananarivo" back="/app" />
      <Async state={state}>
        {(d) => {
          if (!f) return null;
          const s = d.subscription;
          const days = d.delivery.days.length ? d.delivery.days : ['lundi', 'jeudi'];
          const upcoming = d.orders.filter((o) => o.delivery_date >= todayStr());
          return (
            <div className="stack">
              {s && !editing ? (
                <Card title="Ma formule" action={<Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(true)}>Modifier</Button>}>
                  <div className="formula-current">
                    <div><p className="formula-name">{FORMULA_LABELS[s.formula]}</p><p className="muted">{FORMULA_DESC[s.formula]}</p></div>
                    <StatusBadge map={{ actif: ['Active', 'ok'], pause: ['En pause', 'warn'], arrete: ['Arrêtée', 'muted'] }} value={s.status} />
                  </div>
                  <p className="muted small"><Icon name="pin" size={14} /> {s.address}, {s.quartier} · livraison le {s.delivery_days.join(' et ')}</p>
                  <div className="row-actions">
                    {s.status === 'actif' ? <Button variant="secondary" size="sm" loading={busy} onClick={() => run('pause')}>Mettre en pause</Button>
                      : <Button size="sm" loading={busy} onClick={() => run('actif')}>Reprendre les livraisons</Button>}
                  </div>
                </Card>
              ) : (
                <form className="stack" onSubmit={(e) => { e.preventDefault(); run(); }}>
                  <div className="formulas">
                    {Object.entries(FORMULA_LABELS).map(([k, l]) => (
                      <button key={k} type="button" className={`formula ${f.formula === k ? 'on' : ''}`} onClick={() => setF({ ...f, formula: k })} aria-pressed={f.formula === k}>
                        <span className="formula-name">{l}</span>
                        <span className="muted small">{FORMULA_DESC[k]}</span>
                        <span className="formula-price">{d.prices[k] ? `${mga(d.prices[k])} / semaine` : 'Prix selon votre programme'}</span>
                      </button>
                    ))}
                  </div>
                  <Card>
                    <div className="stack">
                      <div className="field"><span className="label">Jours de livraison</span><Pills multiple label="Jours de livraison" options={days.map((x) => [x, x[0].toUpperCase() + x.slice(1)])} value={f.delivery_days} onChange={(v) => setF({ ...f, delivery_days: v })} /></div>
                      <Field label="Adresse de livraison"><Input required placeholder="Lot, rue, repère" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
                      <Field label="Quartier"><Input required list="quartiers" placeholder="Ex. Ivandry" value={f.quartier} onChange={(e) => setF({ ...f, quartier: e.target.value })} /></Field>
                      <datalist id="quartiers">{(d.delivery.quartiers || []).map((q) => <option key={q} value={q} />)}</datalist>
                      <Field label="Instructions pour le livreur (facultatif)"><Textarea placeholder="Portail vert, appeler en arrivant…" value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
                    </div>
                  </Card>
                  <Notice icon="leaf">Vos menus sont préparés par Annick selon votre programme et vos allergies. La facture est établie avec votre programme.</Notice>
                  <div className="row-actions">
                    {s ? <Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button> : null}
                    <Button type="submit" loading={busy} icon="check">Valider ma formule</Button>
                  </div>
                </form>
              )}
              {upcoming.length ? (
                <Card title="Prochaines livraisons" pad={false}>
                  <ul className="list">
                    {upcoming.map((o) => (
                      <li key={o.id} className="list-row">
                        <span className="list-icon"><Icon name="truck" size={18} /></span>
                        <div className="grow"><strong>{fmtDay(o.delivery_date)}</strong><p className="muted small">{o.items.length} repas</p></div>
                        <StatusBadge map={ORDER_STATUS} value={o.status} />
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : s ? <p className="muted center">Vos prochaines livraisons apparaîtront ici dès que vos menus de la semaine sont prêts.</p> : null}
            </div>
          );
        }}
      </Async>
    </div>
  );
}
