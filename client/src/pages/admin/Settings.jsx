import React, { useEffect, useState } from 'react';
import { post, put } from '../../lib/api';
import { useLoad, fmtDate } from '../../lib/util';
import { Async, Badge, Button, Card, Field, Input, Modal, PageHeader, Pills, Select, Tabs, Textarea, useSubmit, Notice } from '../../ui/kit';

const PRICE_FIELDS = [
  ['bilan', 'Bilan nutritionnel'], ['suivi', 'Consultation de suivi'], ['programme_30', 'Programme 30 jours'], ['programme_60', 'Programme 60 jours'],
  ['programme_90', 'Programme 90 jours'], ['essentiel', 'Repas Essentiel / semaine'], ['equilibre', 'Repas Équilibre / semaine'], ['serenite', 'Repas Sérénité / semaine'], ['livraison', 'Livraison'],
];

export default function Settings() {
  const [tab, setTab] = useState('tarifs');
  const state = useLoad('/admin/settings');
  const [s, setS] = useState(null);
  useEffect(() => { if (state.data && !s) setS(state.data); }, [state.data]);
  const save = useSubmit(async () => setS(await put('/admin/settings', s)), { success: 'Paramètres enregistrés' });
  const upd = (group, key) => (e) => setS({ ...s, [group]: { ...s[group], [key]: e && e.target ? e.target.value : e } });
  return (
    <div className="page">
      <PageHeader title="Paramètres" actions={tab !== 'equipe' && tab !== 'emails' ? <Button icon="check" loading={save.busy} onClick={() => save.run()}>Enregistrer</Button> : null} />
      <Tabs tabs={[['tarifs', 'Tarifs'], ['cabinet', 'Cabinet'], ['paiement', 'Paiement'], ['livraison', 'Livraison & agenda'], ['equipe', 'Équipe'], ['emails', 'E-mails']]} value={tab} onChange={setTab} />
      <Async state={state}>
        {() => (s ? (
          <>
            {tab === 'tarifs' ? (
              <Card title="Tarifs (en Ariary)">
                <p className="muted small">Utilisés pour pré-remplir les factures et affichés aux clients. Laissez 0 pour « prix selon programme ».</p>
                <div className="grid-3 mt">
                  {PRICE_FIELDS.map(([k, l]) => <Field key={k} label={l}><Input inputMode="numeric" value={s.prices[k] || ''} onChange={(e) => setS({ ...s, prices: { ...s.prices, [k]: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 } })} /></Field>)}
                </div>
              </Card>
            ) : null}
            {tab === 'cabinet' ? (
              <Card title="Cabinet">
                <div className="grid-2">
                  <Field label="Nom affiché"><Input value={s.cabinet.name} onChange={upd('cabinet', 'name')} /></Field>
                  <Field label="Praticienne"><Input value={s.cabinet.practitioner} onChange={upd('cabinet', 'practitioner')} /></Field>
                  <Field label="Titre" hint="Ex. Nutritionniste"><Input value={s.cabinet.title} onChange={upd('cabinet', 'title')} /></Field>
                  <Field label="Adresse du cabinet"><Input value={s.cabinet.address} onChange={upd('cabinet', 'address')} /></Field>
                  <Field label="Téléphone"><Input value={s.cabinet.phone} onChange={upd('cabinet', 'phone')} /></Field>
                  <Field label="WhatsApp"><Input value={s.cabinet.whatsapp} onChange={upd('cabinet', 'whatsapp')} /></Field>
                  <Field label="E-mail"><Input value={s.cabinet.email} onChange={upd('cabinet', 'email')} /></Field>
                </div>
                <Field label="Réponse automatique de la messagerie" className="mt"><Textarea value={s.messaging.auto_reply} onChange={upd('messaging', 'auto_reply')} /></Field>
              </Card>
            ) : null}
            {tab === 'paiement' ? (
              <Card title="Numéros de paiement mobile">
                <div className="grid-3">
                  <Field label="MVola"><Input value={s.payment.mvola} onChange={upd('payment', 'mvola')} placeholder="034 …" /></Field>
                  <Field label="Orange Money"><Input value={s.payment.orange_money} onChange={upd('payment', 'orange_money')} placeholder="032 …" /></Field>
                  <Field label="Airtel Money"><Input value={s.payment.airtel_money} onChange={upd('payment', 'airtel_money')} placeholder="033 …" /></Field>
                </div>
                <Field label="Instructions affichées au client" className="mt"><Textarea value={s.payment.instructions} onChange={upd('payment', 'instructions')} /></Field>
                <Notice icon="leaf">Le client paie depuis son téléphone puis déclare son paiement avec la référence. Vous le confirmez dans Facturation. L'intégration automatique MVola / Orange Money pourra être ajoutée une fois les comptes marchands ouverts.</Notice>
              </Card>
            ) : null}
            {tab === 'livraison' ? (
              <Card title="Livraison et agenda">
                <div className="stack">
                  <div className="field"><span className="label">Jours de livraison proposés</span>
                    <Pills multiple label="Jours" options={['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].map((d) => [d, d[0].toUpperCase() + d.slice(1)])} value={s.delivery.days} onChange={(v) => setS({ ...s, delivery: { ...s.delivery, days: v } })} /></div>
                  <Field label="Quartiers desservis" hint="Un par ligne"><Textarea rows={5} value={(s.delivery.quartiers || []).join('\n')} onChange={(e) => setS({ ...s, delivery: { ...s.delivery, quartiers: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) } })} /></Field>
                  <div className="grid-3">
                    <Field label="Durée d'un créneau (min)"><Select options={[[30, '30 min'], [45, '45 min'], [60, '60 min'], [90, '90 min']]} value={s.agenda.slot_minutes} onChange={(e) => setS({ ...s, agenda: { ...s.agenda, slot_minutes: parseInt(e.target.value, 10) } })} /></Field>
                    <Field label="Délai minimum de réservation (h)"><Input inputMode="numeric" value={s.agenda.min_notice_hours} onChange={(e) => setS({ ...s, agenda: { ...s.agenda, min_notice_hours: parseInt(e.target.value, 10) || 0 } })} /></Field>
                    <Field label="Réservation jusqu'à (jours)"><Input inputMode="numeric" value={s.agenda.days_ahead} onChange={(e) => setS({ ...s, agenda: { ...s.agenda, days_ahead: parseInt(e.target.value, 10) || 7 } })} /></Field>
                  </div>
                </div>
              </Card>
            ) : null}
          </>
        ) : null)}
      </Async>
      {tab === 'equipe' ? <Team /> : null}
      {tab === 'emails' ? <Emails /> : null}
    </div>
  );
}

function Team() {
  const state = useLoad('/admin/staff');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ role: 'kitchen', first_name: '', last_name: '', email: '', phone: '' });
  const [created, setCreated] = useState(null);
  const add = useSubmit(async () => { setCreated(await post('/admin/staff', f)); state.reload(); });
  const toggle = useSubmit(async (u) => { await put(`/admin/staff/${u.id}`, { active: !u.active }); state.reload(); }, { success: 'Compte mis à jour' });
  return (
    <Card title="Équipe" action={<Button size="sm" icon="plus" onClick={() => { setAdding(true); setCreated(null); }}>Ajouter</Button>} pad={false}>
      <Async state={state}>
        {({ staff }) => (
          <ul className="list">
            {staff.map((u) => (
              <li key={u.id} className="list-row">
                <div className="grow"><strong>{u.first_name} {u.last_name}</strong><p className="muted small">{u.email} · {u.role === 'admin' ? 'Administratrice' : 'Cuisine & livraison'}{u.last_login_at ? ` · dernière connexion ${fmtDate(u.last_login_at)}` : ''}</p></div>
                {u.active ? <Badge tone="ok">Actif</Badge> : <Badge>Désactivé</Badge>}
                <Button size="sm" variant="ghost" onClick={() => toggle.run(u)}>{u.active ? 'Désactiver' : 'Réactiver'}</Button>
              </li>
            ))}
          </ul>
        )}
      </Async>
      {adding ? (
        <Modal title="Ajouter un membre" onClose={() => setAdding(false)} footer={created ? <Button onClick={() => setAdding(false)}>Fermer</Button> : <><Button variant="ghost" onClick={() => setAdding(false)}>Annuler</Button><Button loading={add.busy} onClick={() => add.run()}>Créer le compte</Button></>}>
          {created ? <Notice icon="check" tone="ok">Compte créé. Mot de passe temporaire : <strong className="mono">{created.temp_password}</strong></Notice> : (
            <div className="stack">
              <div className="field"><span className="label">Rôle</span><Pills label="Rôle" options={[['kitchen', 'Cuisine & livraison'], ['admin', 'Administratrice']]} value={f.role} onChange={(v) => setF({ ...f, role: v || 'kitchen' })} /></div>
              <div className="grid-2">
                <Field label="Prénom"><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></Field>
                <Field label="Nom"><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></Field>
              </div>
              <Field label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              <Field label="Téléphone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            </div>
          )}
        </Modal>
      ) : null}
    </Card>
  );
}

function Emails() {
  const state = useLoad('/admin/emails');
  const STATUS = { envoye: ['Envoyé', 'ok'], erreur: ['Erreur', 'danger'], non_configure: ['Non envoyé (SMTP non configuré)', 'warn'] };
  return (
    <Card title="Derniers e-mails" pad={false}>
      <Async state={state}>
        {({ emails }) => (emails.length ? (
          <ul className="list">{emails.map((e) => <li key={e.id} className="list-row"><div className="grow"><strong>{e.subject}</strong><p className="muted small">{e.to_addr} · {fmtDate(e.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{e.error ? ` · ${e.error}` : ''}</p></div><Badge tone={STATUS[e.status][1]}>{STATUS[e.status][0]}</Badge></li>)}</ul>
        ) : <p className="muted pad">Aucun e-mail pour l'instant.</p>)}
      </Async>
    </Card>
  );
}
