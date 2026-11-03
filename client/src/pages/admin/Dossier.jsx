import React, { useEffect, useMemo, useState } from 'react';
import { get, post, put } from '../../lib/api';
import { navigate, useRoute } from '../../lib/router';
import {
  useLoad, fmtDate, fmtDateTime, relDays, num, mga, todayStr, mondayOf, addDays, fmtShort, DAYS, SLOTS, METRICS, CONDITIONS,
  FORMULA_LABELS, FORMULA_DESC, INVOICE_STATUS, APPT_STATUS, PAY_METHODS,
} from '../../lib/util';
import {
  Async, Avatar, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pills, Progress, Select, StatusBadge, Tabs, Textarea, useSubmit, Notice, useToast,
} from '../../ui/kit';
import { LineChart } from '../../ui/chart';
import { Icon } from '../../ui/icons';
import ProfileForm, { profilePayload } from '../shared/ProfileForm';
import Chat from '../shared/Chat';
import { InvoiceView } from '../client/Profil';

const TABS = [['apercu', 'Aperçu'], ['fiche', 'Fiche'], ['consultations', 'Consultations'], ['programme', 'Programme'], ['checkins', 'Check-ins'], ['menus', 'Menus'], ['repas', 'Repas'], ['factures', 'Factures'], ['messages', 'Messages']];

export default function Dossier({ params }) {
  const { query } = useRoute();
  const id = params.id;
  const state = useLoad(`/admin/clients/${id}`);
  const tab = query.tab || 'apercu';
  const setTab = (t) => navigate(`/cockpit/clients/${id}?tab=${t}`, { replace: true });
  return (
    <div className="page">
      <Async state={state}>
        {(d) => {
          const u = d.user;
          const unpaid = d.invoices.filter((i) => i.status === 'en_attente' || i.status === 'declaree').length;
          return (
            <>
              <div className="dossier-head">
                <button type="button" className="icon-btn" aria-label="Retour à la liste" onClick={() => navigate('/cockpit/clients')}><Icon name="back" /></button>
                <Avatar user={u} size={56} />
                <div className="grow">
                  <h1>{u.first_name} {u.last_name} {!u.active ? <Badge tone="muted">Désactivé</Badge> : null}</h1>
                  <p className="muted small">{[u.phone, u.email, d.profile && d.profile.quartier].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="row-actions">
                  <Button variant="secondary" size="sm" icon="message" onClick={() => setTab('messages')}>Message</Button>
                  <Button size="sm" icon="plus" onClick={() => setTab('consultations')}>Consultation</Button>
                </div>
              </div>
              <Tabs tabs={TABS.map(([k, l]) => [k, l, k === 'factures' && unpaid ? unpaid : k === 'checkins' ? d.checkins.filter((c) => !c.reviewed_at).length || null : null])} value={tab} onChange={setTab} />
              {tab === 'apercu' ? <Apercu d={d} setTab={setTab} /> : null}
              {tab === 'fiche' ? <FicheTab d={d} reload={state.reload} /> : null}
              {tab === 'consultations' ? <Consultations d={d} reload={state.reload} /> : null}
              {tab === 'programme' ? <Programme d={d} reload={state.reload} /> : null}
              {tab === 'checkins' ? <CheckinsTab d={d} reload={state.reload} /> : null}
              {tab === 'menus' ? <MenuPlanner clientId={id} profile={d.profile} subscription={d.subscription} /> : null}
              {tab === 'repas' ? <RepasTab d={d} reload={state.reload} /> : null}
              {tab === 'factures' ? <FacturesTab d={d} reload={state.reload} /> : null}
              {tab === 'messages' ? <Card pad={false} className="chat-card"><Chat path={`/admin/clients/${id}/messages`} otherName={u.first_name} templates={MSG_TEMPLATES(u.first_name)} /></Card> : null}
            </>
          );
        }}
      </Async>
    </div>
  );
}

const MSG_TEMPLATES = (n) => [
  `Bonjour ${n}, je n'ai pas reçu votre check-in cette semaine. Tout va bien ? 2 minutes suffisent 🙂`,
  `Bravo ${n} pour cette belle semaine, continuez comme ça !`,
  `Bonjour ${n}, vos menus de la semaine sont prêts dans l'application.`,
  `Pour ce symptôme, je vous conseille de consulter votre médecin rapidement.`,
];

// ---------- Aperçu ----------
function Apercu({ d, setTab }) {
  const p = d.active_program;
  const metric = METRICS[p ? p.metric : 'weight'];
  const pts = d.checkins.slice().reverse().map((c) => ({ x: c.created_at, y: c[p ? p.metric : 'weight'] }));
  const pr = d.profile || {};
  const next = d.appointments.find((a) => a.status === 'confirme' && new Date(a.starts_at) > new Date());
  const cond = (pr.conditions || []).map((c) => (CONDITIONS.find((x) => x[0] === c) || [c, c])[1]);
  return (
    <div className="dash-grid">
      <div className="stack">
        <Card title={p ? `Programme ${p.kind} jours · ${p.goal_label}` : 'Aucun programme en cours'} action={<Button variant="ghost" size="sm" onClick={() => setTab('programme')}>{p ? 'Gérer' : 'Démarrer'}</Button>}>
          {p ? (
            <>
              <p className="muted small">Du {fmtDate(p.start_date)} au {fmtDate(p.end_date)}</p>
              {d.progress ? <><Progress value={d.progress.pct} /><p className="small">{d.progress.pct} % de l'objectif · {metric.label.toLowerCase()} actuel <strong>{num(d.progress.current)} {metric.unit}</strong> (départ {num(p.start_value)}, cible {num(p.target_value)})</p></> : null}
              <LineChart points={pts} target={p.target_value} unit={metric.unit} height={200} label={metric.label} />
            </>
          ) : <p className="muted">Créez un programme après le bilan pour suivre la progression vers l'objectif.</p>}
        </Card>
        <Card title="Derniers check-ins" action={<Button variant="ghost" size="sm" onClick={() => setTab('checkins')}>Tout voir</Button>} pad={false}>
          {d.checkins.length ? <CheckinList items={d.checkins.slice(0, 4)} /> : <Empty icon="check" title="Aucun check-in" />}
        </Card>
      </div>
      <div className="stack">
        <Card title="Points d'attention">
          <div className="facts">
            <p><span className="muted">Particularités</span><strong>{cond.length ? cond.join(', ') : '—'}{pr.condition_other ? ` (${pr.condition_other})` : ''}</strong></p>
            <p><span className="muted">Allergies</span><strong className={pr.allergies ? 'text-danger' : ''}>{pr.allergies || '—'}</strong></p>
            <p><span className="muted">Aliments interdits</span><strong>{pr.forbidden_foods || '—'}</strong></p>
            <p><span className="muted">Traitement</span><strong>{pr.medication || '—'}</strong></p>
            <p><span className="muted">Raison de consultation</span><strong>{pr.reason || '—'}</strong></p>
          </div>
        </Card>
        <Card title="Prochain rendez-vous">
          {next ? <p><strong>{fmtDateTime(next.starts_at)}</strong><br /><span className="muted small">{next.kind === 'bilan' ? 'Bilan' : 'Suivi'} · {next.format}</span>{next.client_note ? <span className="block small">« {next.client_note} »</span> : null}</p> : <p className="muted">Aucun</p>}
        </Card>
        <Card title="Repas livrés" action={<Button variant="ghost" size="sm" onClick={() => setTab('repas')}>Gérer</Button>}>
          {d.subscription ? <p><strong>{FORMULA_LABELS[d.subscription.formula]}</strong> · <StatusBadge map={{ actif: ['Active', 'ok'], pause: ['En pause', 'warn'], arrete: ['Arrêtée', 'muted'] }} value={d.subscription.status} /><br /><span className="muted small">{d.subscription.quartier} · {d.subscription.delivery_days.join(', ')}</span></p> : <p className="muted">Pas d'abonnement</p>}
        </Card>
        {d.tests.length ? <Card title="Test de vitalité"><p><strong className="kpi">{d.tests[0].score}</strong>/100 <span className="muted small">le {fmtDate(d.tests[0].created_at)}</span></p></Card> : null}
      </div>
    </div>
  );
}

function CheckinList({ items, onReview }) {
  return (
    <ul className="list">
      {items.map((c) => (
        <li key={c.id} className="list-row">
          <div className="grow">
            <strong>{fmtDate(c.created_at)}</strong> {!c.reviewed_at ? <Badge tone="info">Nouveau</Badge> : null}
            <p className="small">{[c.weight !== null && `${num(c.weight)} kg`, c.waist !== null && `${num(c.waist)} cm`, c.energy && `énergie ${c.energy}/5`, c.sleep && `sommeil ${c.sleep}`, c.glucose !== null && `glycémie ${num(c.glucose, 2)}`, c.bp && `TA ${c.bp}`].filter(Boolean).join(' · ')}</p>
            {c.note ? <p className="muted small">« {c.note} »</p> : null}
            {c.review_note ? <p className="review-note"><Icon name="message" size={14} />{c.review_note}</p> : null}
          </div>
          {c.photo ? <a href={`/api/files/${c.photo}`} target="_blank" rel="noreferrer"><img className="thumb" src={`/api/files/${c.photo}`} alt="Photo du repas" loading="lazy" /></a> : null}
          {onReview && !c.reviewed_at ? <Button size="sm" variant="secondary" onClick={() => onReview(c)}>Consulter</Button> : null}
        </li>
      ))}
    </ul>
  );
}

export function ReviewModal({ checkin, onClose, onDone }) {
  const [note, setNote] = useState('');
  const { run, busy } = useSubmit(async (reply) => { await post(`/admin/checkins/${checkin.id}/review`, { note: reply ? note : null }); onDone(); }, { success: 'Check-in consulté' });
  return (
    <Modal title={`Check-in du ${fmtDate(checkin.created_at)}`} onClose={onClose} footer={<><Button variant="ghost" onClick={() => run(false)} loading={busy}>Marquer comme vu</Button><Button icon="send" disabled={!note.trim()} loading={busy} onClick={() => run(true)}>Répondre</Button></>}>
      <div className="stack">
        <CheckinList items={[{ ...checkin, reviewed_at: 'x' }]} />
        <Field label="Votre retour (envoyé dans la messagerie du client)"><Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Belle régularité cette semaine ! Pensez à boire davantage l'après-midi." autoFocus /></Field>
      </div>
    </Modal>
  );
}

// ---------- Fiche (partie patient + compte) ----------
function FicheTab({ d, reload }) {
  const [p, setP] = useState(d.profile || {});
  const [u, setU] = useState({ first_name: d.user.first_name, last_name: d.user.last_name, email: d.user.email, phone: d.user.phone, active: d.user.active });
  const [fields, setFields] = useState((d.profile && d.profile.checkin_fields) || ['weight', 'waist', 'energy', 'sleep']);
  const [pwd, setPwd] = useState(null);
  const save = useSubmit(async () => { await put(`/admin/clients/${d.user.id}`, { ...u, profile: profilePayload(p), checkin_fields: fields }); reload(); }, { success: 'Fiche enregistrée' });
  const reset = useSubmit(async () => setPwd((await post(`/admin/clients/${d.user.id}/reset-password`)).temp_password));
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save.run(); }}>
      <Card title="Compte">
        <div className="grid-2">
          <Field label="Prénom"><Input value={u.first_name} onChange={(e) => setU({ ...u, first_name: e.target.value })} /></Field>
          <Field label="Nom"><Input value={u.last_name} onChange={(e) => setU({ ...u, last_name: e.target.value })} /></Field>
          <Field label="E-mail"><Input type="email" value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} /></Field>
          <Field label="Téléphone"><Input value={u.phone} onChange={(e) => setU({ ...u, phone: e.target.value })} /></Field>
        </div>
        <div className="field mt"><span className="label">Champs du check-in hebdomadaire</span>
          <Pills multiple label="Champs du check-in" options={[['weight', 'Poids'], ['waist', 'Tour de taille'], ['energy', 'Énergie'], ['sleep', 'Sommeil'], ['glucose', 'Glycémie'], ['bp', 'Tension']]} value={fields} onChange={setFields} />
          <p className="hint">Ajoutez la glycémie pour un client diabétique, la tension pour un client hypertendu.</p>
        </div>
        <div className="row-actions mt">
          <Button variant="ghost" size="sm" icon="settings" loading={reset.busy} onClick={() => { if (confirm('Générer un nouveau mot de passe temporaire ? Le client sera déconnecté.')) reset.run(); }}>Réinitialiser le mot de passe</Button>
          <Button variant="ghost" size="sm" onClick={() => setU({ ...u, active: !u.active })}>{u.active ? 'Désactiver le compte' : 'Réactiver le compte'}</Button>
          {!u.active ? <Badge tone="warn">Sera désactivé à l'enregistrement</Badge> : null}
        </div>
        {pwd ? <Notice icon="settings">Nouveau mot de passe temporaire : <strong className="mono">{pwd}</strong>. Transmettez-le au client.</Notice> : null}
      </Card>
      <ProfileForm value={p} onChange={setP} />
      <div className="sticky-actions"><Button type="submit" size="lg" icon="check" loading={save.busy}>Enregistrer la fiche</Button></div>
    </form>
  );
}

// ---------- Consultations (partie praticien) ----------
function bmi(w, h) { const hm = parseFloat(String(h).replace(',', '.')) / 100; const ww = parseFloat(String(w).replace(',', '.')); return hm && ww ? num(ww / (hm * hm), 1) : '—'; }
function whr(w, h) { const a = parseFloat(String(w).replace(',', '.')); const b = parseFloat(String(h).replace(',', '.')); return a && b ? num(a / b, 2) : '—'; }

function Consultations({ d, reload }) {
  const [editing, setEditing] = useState(null);
  const last = d.consultations[0];
  const blank = { consulted_at: todayStr(), height: last ? last.height : '', peds: {} };
  return (
    <div className="stack">
      {editing ? <ConsultationForm initial={editing} clientId={d.user.id} appointments={d.appointments} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} /> : (
        <Button icon="plus" onClick={() => setEditing(blank)} className="self-start">Nouvelle consultation</Button>
      )}
      {d.consultations.length ? d.consultations.map((c) => (
        <Card key={c.id} title={`Consultation du ${fmtDate(c.consulted_at)}`} action={<Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(c)}>Modifier</Button>}>
          <div className="measures">
            {[['Poids', c.weight, 'kg'], ['Taille', c.height, 'cm'], ['IMC', c.weight && c.height ? bmi(c.weight, c.height) : null, ''], ['Tour de taille', c.waist, 'cm'], ['Tour de hanches', c.hip, 'cm'], ['Ratio T/H', c.waist && c.hip ? whr(c.waist, c.hip) : null, ''], ['TA', c.bp, ''], ['FC', c.hr, 'bpm'], ['Masse grasse', c.fat_pct, '%']]
              .filter(([, v]) => v !== null && v !== undefined && v !== '').map(([l, v, un]) => <div key={l} className="measure"><span>{l}</span><strong>{typeof v === 'number' ? num(v) : v} {un}</strong></div>)}
          </div>
          <div className="facts mt">
            {[['Glycémie', c.glucose], ['Albuminémie', c.albumin], ['Cholestérol', c.cholesterol], ['Triglycérides', c.triglycerides], ['Hémoglobine', c.hemoglobin], ['Autres examens', c.other_tests],
              ['Observations', c.observations], ['Évaluation nutritionnelle', c.assessment], ['Conclusion', c.conclusion], ['Programme proposé', c.program_prescribed], ['Repas proposés', c.meals_prescribed],
              ['Prochain rendez-vous', c.next_appointment ? fmtDate(c.next_appointment) : null], ['Tarif', c.fee]].filter(([, v]) => v).map(([l, v]) => <p key={l}><span className="muted">{l}</span><strong>{v}</strong></p>)}
            {c.internal_notes ? <p className="internal"><span className="muted">Notes internes</span><strong>{c.internal_notes}</strong></p> : null}
          </div>
        </Card>
      )) : !editing ? <Empty icon="edit" title="Aucune consultation enregistrée">Remplissez la fiche pendant le bilan : mesures, bilan biologique, évaluation et suite proposée.</Empty> : null}
    </div>
  );
}

function ConsultationForm({ initial, clientId, appointments, onCancel, onSaved }) {
  const [f, setF] = useState({ ...initial, peds: initial.peds || {} });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isNew = !initial.id;
  const { run, busy } = useSubmit(async () => {
    const body = { ...f };
    for (const k of ['id', 'client_id', 'created_by', 'created_at', 'updated_at']) delete body[k];
    for (const k of Object.keys(body)) if (body[k] === '') body[k] = null;
    if (isNew) await post(`/admin/clients/${clientId}/consultations`, body); else await put(`/admin/consultations/${initial.id}`, body);
    onSaved();
  }, { success: 'Consultation enregistrée' });
  const appts = appointments.filter((a) => a.status === 'confirme');
  return (
    <form className="stack consult-form" onSubmit={(e) => { e.preventDefault(); run(); }}>
      <Card title={isNew ? 'Nouvelle consultation' : `Consultation du ${fmtDate(initial.consulted_at)}`}>
        <div className="grid-3">
          <Field label="Date"><Input type="date" value={f.consulted_at} onChange={set('consulted_at')} /></Field>
          {isNew && appts.length ? <Field label="Rendez-vous lié"><Select placeholder="Aucun" options={appts.map((a) => [a.id, fmtDateTime(a.starts_at)])} value={f.appointment_id} onChange={(e) => setF({ ...f, appointment_id: e.target.value ? parseInt(e.target.value, 10) : null })} /></Field> : null}
        </div>
      </Card>
      <Card title="Mesures anthropométriques">
        <div className="grid-measures">
          <Field label="Poids (kg)"><Input inputMode="decimal" value={f.weight} onChange={set('weight')} /></Field>
          <Field label="Taille (cm)"><Input inputMode="decimal" value={f.height} onChange={set('height')} /></Field>
          <div className="field calc"><span className="label">IMC (calculé)</span><strong>{bmi(f.weight, f.height)}</strong></div>
          <Field label="Tour de taille (cm)"><Input inputMode="decimal" value={f.waist} onChange={set('waist')} /></Field>
          <Field label="Tour de hanches (cm)"><Input inputMode="decimal" value={f.hip} onChange={set('hip')} /></Field>
          <div className="field calc"><span className="label">Ratio T/H (calculé)</span><strong>{whr(f.waist, f.hip)}</strong></div>
          <Field label="TA (mmHg)"><Input placeholder="12/8" value={f.bp} onChange={set('bp')} /></Field>
          <Field label="FC (bpm)"><Input inputMode="numeric" value={f.hr} onChange={set('hr')} /></Field>
          <Field label="Masse grasse (%)"><Input inputMode="decimal" value={f.fat_pct} onChange={set('fat_pct')} /></Field>
          <Field label="Périmètre brachial"><Input value={f.muac} onChange={set('muac')} /></Field>
        </div>
        <details className="mt"><summary className="link">Indices pédiatriques (si applicable)</summary>
          <div className="grid-3 mt">
            <Field label="Poids pour âge"><Input value={f.peds.weight_age} onChange={(e) => setF({ ...f, peds: { ...f.peds, weight_age: e.target.value } })} /></Field>
            <Field label="Taille pour âge"><Input value={f.peds.height_age} onChange={(e) => setF({ ...f, peds: { ...f.peds, height_age: e.target.value } })} /></Field>
            <Field label="Périmètre brachial pour âge"><Input value={f.peds.muac_age} onChange={(e) => setF({ ...f, peds: { ...f.peds, muac_age: e.target.value } })} /></Field>
          </div>
        </details>
      </Card>
      <Card title="Bilan biologique (si disponible)">
        <div className="grid-3">
          <Field label="Glycémie à jeun"><Input placeholder="Ex. 1,05 g/L" value={f.glucose} onChange={set('glucose')} /></Field>
          <Field label="Albuminémie"><Input placeholder="g/L" value={f.albumin} onChange={set('albumin')} /></Field>
          <Field label="Cholestérol total"><Input placeholder="g/L" value={f.cholesterol} onChange={set('cholesterol')} /></Field>
          <Field label="Triglycérides"><Input placeholder="g/L" value={f.triglycerides} onChange={set('triglycerides')} /></Field>
          <Field label="Hémoglobine"><Input placeholder="g/dL" value={f.hemoglobin} onChange={set('hemoglobin')} /></Field>
          <Field label="Date du bilan"><Input type="date" value={f.bio_date} onChange={set('bio_date')} /></Field>
        </div>
        <Field label="Autres examens" className="mt"><Input placeholder="HbA1c, ferritine…" value={f.other_tests} onChange={set('other_tests')} /></Field>
      </Card>
      <Card title="Évaluation et suite">
        <div className="stack">
          <Field label="Observations"><Textarea value={f.observations} onChange={set('observations')} /></Field>
          <Field label="Évaluation nutritionnelle"><Textarea value={f.assessment} onChange={set('assessment')} placeholder="Habitudes, apports, points à améliorer" /></Field>
          <Field label="Conclusion"><Textarea value={f.conclusion} onChange={set('conclusion')} /></Field>
          <div className="grid-2">
            <Field label="Programme proposé"><Select placeholder="—" options={['Consultation simple', 'Programme 30 jours', 'Programme 60 jours', 'Programme 90 jours']} value={f.program_prescribed} onChange={set('program_prescribed')} /></Field>
            <Field label="Repas livrés proposés"><Select placeholder="—" options={['Non', 'Essentiel', 'Équilibre', 'Sérénité']} value={f.meals_prescribed} onChange={set('meals_prescribed')} /></Field>
            <Field label="Prochain rendez-vous"><Input type="date" value={f.next_appointment} onChange={set('next_appointment')} /></Field>
            <Field label="Tarif appliqué"><Input placeholder="Ex. 50 000 MGA" value={f.fee} onChange={set('fee')} /></Field>
          </div>
          <Field label="Notes internes (jamais visibles par le client)"><Textarea value={f.internal_notes} onChange={set('internal_notes')} /></Field>
          <Notice icon="alert" tone="warn">Si un symptôme ou une valeur vous inquiète, orientez le client vers son médecin et notez-le ici.</Notice>
        </div>
      </Card>
      <div className="row-actions sticky-actions"><Button variant="ghost" onClick={onCancel}>Annuler</Button><Button type="submit" icon="check" loading={busy}>Enregistrer la consultation</Button></div>
    </form>
  );
}

// ---------- Programme ----------
function Programme({ d, reload }) {
  const settings = useLoad('/admin/settings');
  const p = d.active_program;
  const lastWeight = d.checkins.find((c) => c.weight !== null);
  const [f, setF] = useState({ kind: '90', start_date: todayStr(), goal_label: '', metric: 'weight', start_value: lastWeight ? lastWeight.weight : (d.consultations[0] && d.consultations[0].weight) || '', target_value: '', invoice_amount: '' });
  const [show, setShow] = useState(!p);
  useEffect(() => { if (settings.data && f.invoice_amount === '') setF((x) => ({ ...x, invoice_amount: settings.data.prices['programme_' + x.kind] || '' })); }, [settings.data]);
  const create = useSubmit(async () => { await post(`/admin/clients/${d.user.id}/programs`, { ...f, invoice_amount: f.invoice_amount ? parseInt(f.invoice_amount, 10) : null }); setShow(false); reload(); }, { success: 'Programme créé' });
  const update = useSubmit(async (status) => { await put(`/admin/programs/${p.id}`, { status }); reload(); }, { success: 'Programme mis à jour' });
  const setKind = (k) => setF({ ...f, kind: k, invoice_amount: settings.data ? settings.data.prices['programme_' + k] || '' : f.invoice_amount });
  return (
    <div className="stack">
      {p ? (
        <Card title={`Programme ${p.kind} jours en cours`} action={<StatusBadge map={{ actif: ['Actif', 'ok'] }} value={p.status} />}>
          <div className="facts">
            <p><span className="muted">Objectif</span><strong>{p.goal_label}</strong></p>
            <p><span className="muted">Période</span><strong>{fmtDate(p.start_date)} → {fmtDate(p.end_date)}</strong></p>
            <p><span className="muted">Indicateur</span><strong>{METRICS[p.metric].label} : {num(p.start_value)} → {num(p.target_value)} {METRICS[p.metric].unit}</strong></p>
          </div>
          {d.progress ? <><Progress value={d.progress.pct} /><p className="small">{d.progress.pct} % de l'objectif atteint</p></> : null}
          <div className="row-actions mt">
            <Button variant="secondary" size="sm" loading={update.busy} onClick={() => update.run('termine')}>Clôturer le programme</Button>
            <Button variant="ghost" size="sm" loading={update.busy} onClick={() => update.run('pause')}>Mettre en pause</Button>
            {!show ? <Button size="sm" icon="plus" onClick={() => setShow(true)}>Nouveau programme</Button> : null}
          </div>
        </Card>
      ) : null}
      {show ? (
        <Card title={p ? 'Renouveler / nouveau programme' : 'Démarrer un programme'}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); create.run(); }}>
            <div className="field"><span className="label">Durée</span><Pills label="Durée" options={[['30', '30 jours'], ['60', '60 jours'], ['90', '90 jours']]} value={f.kind} onChange={(v) => setKind(v || f.kind)} /></div>
            <div className="grid-2">
              <Field label="Date de début"><Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
              <Field label="Objectif (affiché au client)"><Input required placeholder="Ex. -6 kg en 90 jours" value={f.goal_label} onChange={(e) => setF({ ...f, goal_label: e.target.value })} /></Field>
              <Field label="Indicateur suivi"><Select options={Object.entries(METRICS).map(([k, m]) => [k, m.label])} value={f.metric} onChange={(e) => setF({ ...f, metric: e.target.value })} /></Field>
              <Field label={`Valeur de départ (${METRICS[f.metric].unit})`}><Input inputMode="decimal" value={f.start_value} onChange={(e) => setF({ ...f, start_value: e.target.value })} /></Field>
              <Field label={`Valeur cible (${METRICS[f.metric].unit})`}><Input inputMode="decimal" value={f.target_value} onChange={(e) => setF({ ...f, target_value: e.target.value })} /></Field>
              <Field label="Montant à facturer (MGA)" hint="Laissez vide pour ne pas créer de facture"><Input inputMode="numeric" value={f.invoice_amount} onChange={(e) => setF({ ...f, invoice_amount: e.target.value.replace(/\D/g, '') })} /></Field>
            </div>
            {p ? <Notice icon="alert" tone="warn">Le programme en cours sera clôturé automatiquement.</Notice> : null}
            <div className="row-actions">{p ? <Button variant="ghost" onClick={() => setShow(false)}>Annuler</Button> : null}<Button type="submit" icon="check" loading={create.busy}>Créer le programme</Button></div>
          </form>
        </Card>
      ) : null}
      {d.programs.filter((x) => x.status !== 'actif').length ? (
        <Card title="Programmes précédents" pad={false}>
          <ul className="list">{d.programs.filter((x) => x.status !== 'actif').map((x) => <li key={x.id} className="list-row"><div className="grow"><strong>{x.kind} jours · {x.goal_label}</strong><p className="muted small">{fmtDate(x.start_date)} → {fmtDate(x.end_date)}</p></div><Badge>{x.status}</Badge></li>)}</ul>
        </Card>
      ) : null}
    </div>
  );
}

// ---------- Check-ins ----------
function CheckinsTab({ d, reload }) {
  const [review, setReview] = useState(null);
  const [metric, setMetric] = useState(d.active_program ? d.active_program.metric : 'weight');
  const pts = d.checkins.slice().reverse().map((c) => ({ x: c.created_at, y: c[metric] }));
  const target = d.active_program && d.active_program.metric === metric ? d.active_program.target_value : null;
  const unit = { weight: 'kg', waist: 'cm', glucose: 'g/L', energy: '/5' }[metric];
  return (
    <div className="stack">
      <Card title="Évolution" action={<Select aria-label="Indicateur" options={[['weight', 'Poids'], ['waist', 'Tour de taille'], ['energy', 'Énergie'], ['glucose', 'Glycémie']]} value={metric} onChange={(e) => setMetric(e.target.value)} />}>
        <LineChart points={pts} target={target} unit={unit} />
      </Card>
      <Card title={`${d.checkins.length} check-ins`} pad={false}>
        {d.checkins.length ? <CheckinList items={d.checkins} onReview={setReview} /> : <Empty icon="check" title="Aucun check-in pour l'instant" />}
      </Card>
      {review ? <ReviewModal checkin={review} onClose={() => setReview(null)} onDone={() => { setReview(null); reload(); }} /> : null}
    </div>
  );
}

// ---------- Planificateur de menus ----------
export function MenuPlanner({ clientId, profile, subscription }) {
  const toast = useToast();
  const [week, setWeek] = useState(mondayOf(todayStr()));
  const meals = useLoad('/admin/meals');
  const [plan, setPlan] = useState(null);
  const [note, setNote] = useState('');
  const [dirty, setDirty] = useState(false);
  const load = async () => {
    setPlan(null);
    try { const d = await get(`/admin/clients/${clientId}/menu?week=${week}`); setPlan(d.items.map((i) => ({ day: i.day, slot: i.slot, meal_id: i.meal_id }))); setNote(d.note || ''); setDirty(false); }
    catch (e) { toast(e.message, 'danger'); }
  };
  useEffect(() => { load(); }, [week, clientId]);
  const save = useSubmit(async () => { await put(`/admin/clients/${clientId}/menu`, { week_start: week, items: plan.filter((i) => i.meal_id), note }); setDirty(false); }, { success: 'Menu enregistré, visible par le client' });
  const copy = useSubmit(async () => { const d = await post(`/admin/clients/${clientId}/menu/copy`, { week_start: week }); setPlan(d.items.map((i) => ({ day: i.day, slot: i.slot, meal_id: i.meal_id }))); setNote(d.note || ''); }, { success: 'Menu de la semaine précédente copié' });
  const get1 = (day, slot) => (plan || []).find((i) => i.day === day && i.slot === slot);
  const set1 = (day, slot, mealId) => {
    setDirty(true);
    setPlan((p) => [...p.filter((i) => !(i.day === day && i.slot === slot)), ...(mealId ? [{ day, slot, meal_id: parseInt(mealId, 10) }] : [])]);
  };
  const fillRow = (slot) => {
    const first = (plan || []).find((i) => i.slot === slot);
    if (!first) return;
    setDirty(true);
    setPlan((p) => [...p.filter((i) => i.slot !== slot), ...DAYS.map((_, day) => ({ day, slot, meal_id: (p.find((i) => i.day === day && i.slot === slot) || first).meal_id }))]);
  };
  const warn = profile && (profile.allergies || profile.forbidden_foods);
  return (
    <div className="stack">
      <div className="week-nav">
        <button type="button" className="icon-btn" aria-label="Semaine précédente" onClick={() => setWeek(addDays(week, -7))}><Icon name="back" /></button>
        <strong>Semaine du {fmtShort(week)} au {fmtShort(addDays(week, 6))}</strong>
        <button type="button" className="icon-btn" aria-label="Semaine suivante" onClick={() => setWeek(addDays(week, 7))}><Icon name="chevron" /></button>
      </div>
      {warn ? <Notice icon="alert" tone="danger"><strong>Attention :</strong> {[profile.allergies && `allergies : ${profile.allergies}`, profile.forbidden_foods && `aliments interdits : ${profile.forbidden_foods}`].filter(Boolean).join(' · ')}</Notice> : null}
      {subscription && subscription.status === 'actif' ? <Notice icon="bike">Formule {FORMULA_LABELS[subscription.formula]} : {FORMULA_DESC[subscription.formula]}. Les repas de ces créneaux seront préparés et livrés.</Notice> : null}
      {!plan || !meals.data ? <div className="loading"><span className="spinner" /></div> : (
        <>
          <div className="card nopad table-wrap">
            <table className="table planner">
              <thead><tr><th>Repas</th>{DAYS.map((d) => <th key={d}>{d.slice(0, 3)}</th>)}</tr></thead>
              <tbody>
                {SLOTS.map((s) => (
                  <tr key={s.key}>
                    <th scope="row"><span>{s.label}</span><button type="button" className="link small" onClick={() => fillRow(s.key)} title="Recopier le premier plat sur les jours vides">Remplir</button></th>
                    {DAYS.map((_, day) => {
                      const cur = get1(day, s.key);
                      return (
                        <td key={day}>
                          <select className={`input planner-select ${cur ? 'filled' : ''}`} title={cur ? (meals.data.meals.find((m) => m.id === cur.meal_id) || {}).name : ''} aria-label={`${s.label}, ${DAYS[day]}`} value={cur ? cur.meal_id : ''} onChange={(e) => set1(day, s.key, e.target.value)}>
                            <option value="">—</option>
                            {meals.data.meals.filter((m) => m.active && m.meal_type === s.key).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Field label="Mot pour le client (facultatif)"><Textarea value={note} onChange={(e) => { setNote(e.target.value); setDirty(true); }} placeholder="Ex. Cette semaine, on augmente les légumes au dîner." /></Field>
          <div className="row-actions">
            <Button variant="ghost" icon="copy" loading={copy.busy} onClick={() => copy.run()}>Copier la semaine précédente</Button>
            <Button icon="check" variant={dirty ? 'primary' : 'ghost'} disabled={!dirty} loading={save.busy} onClick={() => save.run()}>{dirty ? 'Enregistrer le menu' : 'Menu enregistré'}</Button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Repas livrés ----------
function RepasTab({ d, reload }) {
  const s = d.subscription;
  const [f, setF] = useState(s ? { ...s } : { formula: 'equilibre', delivery_days: ['lundi', 'jeudi'], address: (d.profile && d.profile.address) || '', quartier: (d.profile && d.profile.quartier) || '', instructions: '', status: 'actif' });
  const { run, busy } = useSubmit(async () => { await put(`/admin/clients/${d.user.id}/subscription`, f); reload(); }, { success: 'Abonnement enregistré' });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); run(); }}>
      <div className="formulas">
        {Object.entries(FORMULA_LABELS).map(([k, l]) => (
          <button key={k} type="button" className={`formula ${f.formula === k ? 'on' : ''}`} aria-pressed={f.formula === k} onClick={() => setF({ ...f, formula: k })}><span className="formula-name">{l}</span><span className="muted small">{FORMULA_DESC[k]}</span></button>
        ))}
      </div>
      <Card>
        <div className="stack">
          <div className="field"><span className="label">Jours de livraison</span><Pills multiple label="Jours" options={['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].map((x) => [x, x[0].toUpperCase() + x.slice(1)])} value={f.delivery_days} onChange={(v) => setF({ ...f, delivery_days: v })} /></div>
          <div className="grid-2">
            <Field label="Adresse"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
            <Field label="Quartier"><Input value={f.quartier} onChange={(e) => setF({ ...f, quartier: e.target.value })} /></Field>
          </div>
          <Field label="Instructions de livraison"><Textarea value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
          <div className="field"><span className="label">Statut</span><Pills label="Statut" options={[['actif', 'Actif'], ['pause', 'En pause'], ['arrete', 'Arrêté']]} value={f.status} onChange={(v) => setF({ ...f, status: v || 'actif' })} /></div>
        </div>
      </Card>
      <div className="row-actions"><Button type="submit" icon="check" loading={busy}>Enregistrer l'abonnement</Button></div>
    </form>
  );
}

// ---------- Factures ----------
function FacturesTab({ d, reload }) {
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState(null);
  return (
    <div className="stack">
      <Button icon="plus" className="self-start" onClick={() => setCreating(true)}>Nouvelle facture</Button>
      {d.invoices.length ? <InvoiceTable invoices={d.invoices} onChange={reload} onView={setView} /> : <Empty icon="invoice" title="Aucune facture" />}
      {creating ? <NewInvoice clientId={d.user.id} onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} /> : null}
      {view ? <InvoiceView invoice={view} client={`${d.user.first_name} ${d.user.last_name}`} onClose={() => setView(null)} /> : null}
    </div>
  );
}

export function InvoiceTable({ invoices, onChange, onView, showClient }) {
  const confirmPay = useSubmit(async (i, method) => { await post(`/admin/invoices/${i.id}/confirm`, { method }); onChange(); }, { success: 'Paiement confirmé' });
  const reject = useSubmit(async (i) => { await post(`/admin/invoices/${i.id}/reject`); onChange(); }, { success: 'Paiement rejeté, le client est prévenu' });
  const cancel = useSubmit(async (i) => { await post(`/admin/invoices/${i.id}/cancel`); onChange(); }, { success: 'Facture annulée' });
  const [paying, setPaying] = useState(null);
  return (
    <div className="card nopad table-wrap">
      <table className="table">
        <thead><tr><th>N°</th>{showClient ? <th>Client</th> : null}<th>Intitulé</th><th className="right">Montant</th><th>Statut</th><th>Paiement</th><th aria-label="Actions" /></tr></thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td className="mono small">{i.number}<br /><span className="muted">{fmtDate(i.issued_at, { day: 'numeric', month: 'short' })}</span></td>
              {showClient ? <td><a href={`/cockpit/clients/${i.client_id}?tab=factures`} onClick={(e) => { e.preventDefault(); navigate(`/cockpit/clients/${i.client_id}?tab=factures`); }}>{i.first_name} {i.last_name}</a></td> : null}
              <td>{i.label}</td>
              <td className="right amount">{mga(i.amount_mga)}</td>
              <td><StatusBadge map={INVOICE_STATUS} value={i.status} /></td>
              <td className="small">{i.method ? PAY_METHODS[i.method] : '—'}{i.payment_ref ? <><br /><span className="mono">{i.payment_ref}</span></> : null}</td>
              <td>
                <div className="row-actions nowrap">
                  {i.status === 'declaree' ? <><Button size="sm" variant="green" loading={confirmPay.busy} onClick={() => confirmPay.run(i)}>Confirmer</Button><Button size="sm" variant="ghost" onClick={() => reject.run(i)}>Rejeter</Button></> : null}
                  {i.status === 'en_attente' ? <Button size="sm" variant="secondary" onClick={() => setPaying(i)}>Encaisser</Button> : null}
                  <Button size="sm" variant="ghost" icon="print" aria-label="Voir" onClick={() => onView(i)} />
                  {i.status !== 'payee' && i.status !== 'annulee' ? <Button size="sm" variant="ghost" icon="x" aria-label="Annuler la facture" onClick={() => { if (confirm(`Annuler la facture ${i.number} ?`)) cancel.run(i); }} /> : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {paying ? (
        <Modal title={`Encaisser ${mga(paying.amount_mga)}`} onClose={() => setPaying(null)}>
          <p className="muted">Moyen de paiement reçu :</p>
          <div className="pills mt">{Object.entries(PAY_METHODS).map(([k, l]) => <button key={k} type="button" className="pill" onClick={async () => { await confirmPay.run(paying, k); setPaying(null); }}>{l}</button>)}</div>
        </Modal>
      ) : null}
    </div>
  );
}

export function NewInvoice({ clientId, clients, onClose, onDone }) {
  const settings = useLoad('/admin/settings');
  const [cid, setCid] = useState(clientId || '');
  const [lines, setLines] = useState([{ label: '', amount_mga: '' }]);
  const presets = settings.data ? [
    ['Bilan nutritionnel', settings.data.prices.bilan], ['Consultation de suivi', settings.data.prices.suivi],
    ['Repas Essentiel (1 semaine)', settings.data.prices.essentiel], ['Repas Équilibre (1 semaine)', settings.data.prices.equilibre], ['Repas Sérénité (1 semaine)', settings.data.prices.serenite], ['Livraison', settings.data.prices.livraison],
  ] : [];
  const total = lines.reduce((s, l) => s + (parseInt(l.amount_mga, 10) || 0), 0);
  const { run, busy } = useSubmit(async () => { await post('/admin/invoices', { client_id: parseInt(cid, 10), items: lines.filter((l) => l.label).map((l) => ({ label: l.label, amount_mga: parseInt(l.amount_mga, 10) || 0 })) }); onDone(); }, { success: 'Facture créée, le client est prévenu' });
  return (
    <Modal title="Nouvelle facture" wide onClose={onClose} footer={<><span className="grow amount">Total : {mga(total)}</span><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={busy} disabled={!cid || !total} onClick={() => run()}>Créer la facture</Button></>}>
      <div className="stack">
        {clients ? <Field label="Client"><Select placeholder="Choisir un client" options={clients.map((c) => [c.id, `${c.first_name} ${c.last_name}`])} value={cid} onChange={(e) => setCid(e.target.value)} /></Field> : null}
        <div className="pills">{presets.map(([l, p]) => <button key={l} type="button" className="pill" onClick={() => setLines([...lines.filter((x) => x.label), { label: l, amount_mga: p || '' }])}>+ {l}</button>)}</div>
        {lines.map((l, k) => (
          <div key={k} className="invoice-line">
            <Input aria-label="Désignation" placeholder="Désignation" value={l.label} onChange={(e) => setLines(lines.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)))} />
            <Input aria-label="Montant en MGA" inputMode="numeric" placeholder="Montant MGA" value={l.amount_mga} onChange={(e) => setLines(lines.map((x, j) => (j === k ? { ...x, amount_mga: e.target.value.replace(/\D/g, '') } : x)))} />
            <button type="button" className="icon-btn" aria-label="Supprimer la ligne" onClick={() => setLines(lines.length > 1 ? lines.filter((_, j) => j !== k) : [{ label: '', amount_mga: '' }])}><Icon name="x" /></button>
          </div>
        ))}
        <Button variant="ghost" icon="plus" size="sm" className="self-start" onClick={() => setLines([...lines, { label: '', amount_mga: '' }])}>Ajouter une ligne</Button>
      </div>
    </Modal>
  );
}
