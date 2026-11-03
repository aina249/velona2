import React, { useState } from 'react';
import { post, put } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useRoute, navigate, Link } from '../../lib/router';
import { useLoad, todayStr, addDays, mondayOf, fmtDay, fmtShort, DAYS, slotLabel, ORDER_STATUS, FORMULA_LABELS, num } from '../../lib/util';
import { Async, Badge, Button, Card, Empty, Field, Input, Modal, StatusBadge, Tabs, Textarea, useSubmit, Notice } from '../../ui/kit';
import { Icon } from '../../ui/icons';

const VIEWS = [['production', 'Production'], ['courses', 'Liste de courses'], ['etiquettes', 'Étiquettes'], ['livraisons', 'Livraisons']];
const NEXT = { a_preparer: ['pret', 'Prêt'], pret: ['en_livraison', 'Partie en livraison'], en_livraison: ['livre', 'Livré'] };

export default function KitchenApp() {
  const { user, logout } = useAuth();
  const { path, query } = useRoute();
  const view = path.split('/')[2] || 'production';
  const date = query.date || todayStr();
  const go = (v, d = date) => navigate(`/cuisine${v === 'production' ? '' : '/' + v}?date=${d}`, { replace: true });
  return (
    <div className="kitchen-shell">
      <header className="kitchen-top no-print">
        <Link to={user.role === 'admin' ? '/cockpit' : '/cuisine'} className="brand"><img src="/symbol.png" alt="" width="30" height="30" /><img src="/wordmark.png" alt="Vélona" height="22" /><span className="chip chip-warm">Cuisine</span></Link>
        <div className="row-actions">
          {user.role === 'admin' ? <Link to="/cockpit" className="btn btn-ghost btn-sm">Retour au cockpit</Link> : null}
          <Button variant="ghost" size="sm" icon="logout" onClick={logout}>Quitter</Button>
        </div>
      </header>
      <main className="kitchen-main">
        <div className="no-print stack">
          <Tabs tabs={VIEWS} value={view} onChange={(v) => go(v)} />
          <div className="week-nav">
            <button type="button" className="icon-btn" aria-label="Jour précédent" onClick={() => go(view, addDays(date, -1))}><Icon name="back" /></button>
            <label className="date-pick"><strong>{fmtDay(date)}</strong><input type="date" value={date} onChange={(e) => e.target.value && go(view, e.target.value)} aria-label="Choisir la date" /></label>
            <button type="button" className="icon-btn" aria-label="Jour suivant" onClick={() => go(view, addDays(date, 1))}><Icon name="chevron" /></button>
          </div>
        </div>
        {view === 'production' ? <Production date={date} /> : null}
        {view === 'courses' ? <Courses date={date} /> : null}
        {view === 'etiquettes' ? <Labels date={date} /> : null}
        {view === 'livraisons' ? <Deliveries date={date} /> : null}
      </main>
    </div>
  );
}

function Production({ date }) {
  const state = useLoad(`/kitchen/orders?from=${date}&to=${date}`);
  const week = mondayOf(date);
  const missing = useLoad(`/kitchen/missing?week_start=${week}`);
  const [report, setReport] = useState(null);
  const gen = useSubmit(async () => { setReport(await post('/kitchen/generate', { week_start: week })); state.reload(); missing.reload(); });
  const bulk = useSubmit(async (status) => { await post('/kitchen/orders/bulk', { status, date }); state.reload(); }, { success: 'Commandes mises à jour' });
  return (
    <div className="stack">
      <Card>
        <div className="gen-row">
          <div className="grow"><strong>Commandes de la semaine du {fmtShort(week)}</strong><p className="muted small">Générées à partir des abonnements et des menus de chaque client. Relancez après une modification de menu.</p></div>
          <Button icon="list" loading={gen.busy} onClick={() => gen.run()}>Générer / mettre à jour</Button>
        </div>
        {report ? <Notice icon="check" tone="ok">{report.created} commande(s) créée(s), {report.updated} mise(s) à jour{report.skipped_locked ? `, ${report.skipped_locked} déjà en préparation (inchangées)` : ''}.</Notice> : null}
        {missing.data && missing.data.clients.length ? <Notice icon="alert" tone="warn"><strong>Menus manquants cette semaine :</strong> {missing.data.clients.map((c) => `${c.first_name} ${c.last_name}`).join(', ')}. Leurs repas apparaîtront « à définir ».</Notice> : null}
      </Card>
      <Async state={state}>
        {({ orders, production }) => (orders.length ? (
          <>
            <Card title="À préparer" action={<Badge tone="info">{production.reduce((s, p) => s + p.portions, 0)} portions</Badge>}>
              <div className="prod-grid">
                {production.map((p) => (
                  <div key={p.meal_id || 'x'} className={`prod-item ${!p.meal_id ? 'warn' : ''}`}><span className="prod-n">{p.portions}</span><span>{p.name}</span></div>
                ))}
              </div>
            </Card>
            <Card title={`${orders.length} commande${orders.length > 1 ? 's' : ''}`} action={<div className="row-actions"><Button size="sm" variant="secondary" loading={bulk.busy} onClick={() => bulk.run('pret')}>Tout marquer prêt</Button></div>} pad={false}>
              <OrderList orders={orders} reload={state.reload} />
            </Card>
          </>
        ) : <Empty icon="truck" title="Aucune livraison ce jour">Générez les commandes de la semaine, ou choisissez un jour de livraison.</Empty>)}
      </Async>
    </div>
  );
}

function OrderList({ orders, reload, delivery }) {
  const [incident, setIncident] = useState(null);
  const setStatus = useSubmit(async (o, status) => { await put(`/kitchen/orders/${o.id}`, { status }); reload(); });
  return (
    <>
      <ul className="list">
        {orders.map((o) => (
          <li key={o.id} className="list-row order-row">
            <div className="grow">
              <strong>{o.first_name} {o.last_name}</strong> <span className="muted small">{o.formula ? FORMULA_LABELS[o.formula] : ''}</span>
              {delivery ? (
                <p className="small"><Icon name="pin" size={14} /> {o.address}{o.quartier ? `, ${o.quartier}` : ''} · <a href={`tel:${o.phone}`}>{o.phone}</a>{o.instructions ? <span className="block muted">« {o.instructions} »</span> : null}</p>
              ) : (
                <p className="small">{o.items.map((i) => `${DAYS[i.day].slice(0, 3)} ${slotLabel(i.slot).toLowerCase()} : ${i.name}`).join(' · ')}</p>
              )}
              {o.allergies || o.forbidden_foods ? <p className="allergy"><Icon name="alert" size={14} /> {[o.allergies && `Allergies : ${o.allergies}`, o.forbidden_foods && `Interdits : ${o.forbidden_foods}`].filter(Boolean).join(' · ')}</p> : null}
              {o.incident_note ? <p className="text-danger small">Incident : {o.incident_note}</p> : null}
            </div>
            <span className="muted small">{o.items.length} repas</span>
            <StatusBadge map={ORDER_STATUS} value={o.status} />
            <div className="row-actions">
              {NEXT[o.status] ? <Button size="sm" variant="green" loading={setStatus.busy} onClick={() => setStatus.run(o, NEXT[o.status][0])}>{NEXT[o.status][1]}</Button> : null}
              {o.status !== 'livre' && o.status !== 'incident' ? <Button size="sm" variant="ghost" onClick={() => setIncident(o)}>Incident</Button> : null}
              {o.status === 'incident' ? <Button size="sm" variant="ghost" onClick={() => setStatus.run(o, 'a_preparer')}>Rouvrir</Button> : null}
            </div>
          </li>
        ))}
      </ul>
      {incident ? <IncidentModal order={incident} onClose={() => setIncident(null)} onDone={() => { setIncident(null); reload(); }} /> : null}
    </>
  );
}

function IncidentModal({ order, onClose, onDone }) {
  const [note, setNote] = useState('');
  const { run, busy } = useSubmit(async () => { await put(`/kitchen/orders/${order.id}`, { status: 'incident', incident_note: note }); onDone(); }, { success: 'Incident signalé, le client est prévenu' });
  return (
    <Modal title={`Incident · ${order.first_name} ${order.last_name}`} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="danger" loading={busy} disabled={!note.trim()} onClick={() => run()}>Signaler</Button></>}>
      <Field label="Que s'est-il passé ?" hint="Ce message est envoyé au client."><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. livreur en retard, repas abîmé, client absent…" autoFocus /></Field>
    </Modal>
  );
}

function Courses({ date }) {
  const [to, setTo] = useState(addDays(date, 2));
  const state = useLoad(`/kitchen/shopping?from=${date}&to=${to}`);
  const [checked, setChecked] = useState({});
  return (
    <div className="stack">
      <div className="no-print row-actions">
        <Field label="Jusqu'au"><Input type="date" value={to} min={date} onChange={(e) => setTo(e.target.value)} /></Field>
        <Button variant="secondary" icon="print" onClick={() => window.print()} className="self-end">Imprimer</Button>
      </div>
      <Async state={state}>
        {(d) => (d.ingredients.length ? (
          <div className="print-area stack">
            <h2 className="print-only">Liste de courses · du {fmtShort(d.from)} au {fmtShort(d.to)}</h2>
            <Card title={`Ingrédients pour ${d.meals.reduce((s, m) => s + m.portions, 0)} portions`} pad={false}>
              <ul className="list">
                {d.ingredients.map((i) => {
                  const k = i.name + i.unit;
                  return (
                    <li key={k} className="list-row">
                      <label className="check grow"><input type="checkbox" checked={!!checked[k]} onChange={() => setChecked({ ...checked, [k]: !checked[k] })} /><span className={checked[k] ? 'done' : ''}>{i.name}</span></label>
                      <strong>{i.unit === 'g' && i.qty >= 1000 ? `${num(i.qty / 1000, 2)} kg` : i.unit === 'ml' && i.qty >= 1000 ? `${num(i.qty / 1000, 2)} L` : `${num(i.qty, 2)} ${i.unit}`}</strong>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card title="Détail par plat" pad={false}>
              <ul className="list">{d.meals.map((m) => <li key={m.id} className="list-row"><span className="grow">{m.name}</span><strong>{m.portions} portion{m.portions > 1 ? 's' : ''}</strong></li>)}</ul>
            </Card>
            <p className="muted small">Quantités calculées à partir des ingrédients par portion de la bibliothèque. Ajoutez une marge pour les pertes.</p>
          </div>
        ) : <Empty icon="cart" title="Rien à acheter sur cette période">Les commandes de la période ne contiennent pas encore de plats.</Empty>)}
      </Async>
    </div>
  );
}

function Labels({ date }) {
  const state = useLoad(`/kitchen/orders?from=${date}&to=${date}`);
  return (
    <Async state={state}>
      {({ orders }) => {
        const labels = orders.filter((o) => o.status !== 'incident').flatMap((o) => o.items.map((i) => ({ o, i })));
        if (!labels.length) return <Empty icon="tag" title="Aucune étiquette pour ce jour" />;
        return (
          <div className="stack">
            <div className="no-print row-actions"><Button icon="print" onClick={() => window.print()}>Imprimer les {labels.length} étiquettes</Button></div>
            <div className="labels print-area">
              {labels.map(({ o, i }, k) => {
                const eatDate = addDays(mondayOf(o.delivery_date), i.day);
                return (
                  <div key={k} className="label-card">
                    <div className="label-top"><img src="/symbol.png" alt="" width="22" height="22" /><strong>{o.first_name} {o.last_name}</strong></div>
                    <p className="label-meal">{i.name}</p>
                    <p className="small"><strong>{DAYS[i.day]} · {slotLabel(i.slot)}</strong> ({fmtShort(eatDate)})</p>
                    {o.allergies ? <p className="small allergy">Allergies : {o.allergies}</p> : null}
                    <p className="tiny">{(new Date(eatDate) - new Date(o.delivery_date)) / 86400000 >= 3
                      ? 'Au congélateur dès réception. Décongeler la veille au réfrigérateur, réchauffer à cœur.'
                      : 'Au réfrigérateur dès réception. Réchauffer à cœur.'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </Async>
  );
}

function Deliveries({ date }) {
  const state = useLoad(`/kitchen/orders?from=${date}&to=${date}`);
  return (
    <Async state={state}>
      {({ orders }) => {
        if (!orders.length) return <Empty icon="truck" title="Aucune livraison ce jour" />;
        const zones = [...new Set(orders.map((o) => o.quartier || 'Quartier non précisé'))];
        return (
          <div className="stack">
            <div className="no-print row-actions"><Button variant="secondary" icon="print" onClick={() => window.print()}>Imprimer la feuille de route</Button></div>
            <div className="print-area stack">
              <h2 className="print-only">Livraisons du {fmtDay(date)}</h2>
              {zones.map((z) => (
                <Card key={z} title={z} action={<Badge>{orders.filter((o) => (o.quartier || 'Quartier non précisé') === z).length} arrêt(s)</Badge>} pad={false}>
                  <OrderList orders={orders.filter((o) => (o.quartier || 'Quartier non précisé') === z)} reload={state.reload} delivery />
                </Card>
              ))}
            </div>
          </div>
        );
      }}
    </Async>
  );
}
