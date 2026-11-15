import React, { useEffect, useState } from 'react';
import { post, put } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Link } from '../../lib/router';
import { useLoad, fmtDate, mga, INVOICE_STATUS, PAY_METHODS } from '../../lib/util';
import { Async, Avatar, Button, Card, Empty, Field, Input, Modal, PageHeader, PasswordInput, Pills, StatusBadge, useSubmit, Notice } from '../../ui/kit';
import { Icon } from '../../ui/icons';
import ProfileForm, { profilePayload } from '../shared/ProfileForm';

export default function Profil() {
  const { user, logout } = useAuth();
  const [pwd, setPwd] = useState(false);
  return (
    <div className="page">
      <PageHeader title="Mon profil" />
      <div className="stack">
        <Card>
          <div className="profile-head">
            <Avatar user={user} size={64} />
            <div><p className="profile-name">{user.first_name} {user.last_name}</p><p className="muted">{user.email}</p><p className="muted small">{user.phone}</p></div>
          </div>
        </Card>
        <Card pad={false}>
          <ul className="list">
            <li><Link to="/app/fiche" className="list-row link-row"><span className="list-icon"><Icon name="user" size={18} /></span><span className="grow">Ma fiche de renseignements</span><Icon name="chevron" size={18} /></Link></li>
            <li><Link to="/app/factures" className="list-row link-row"><span className="list-icon"><Icon name="invoice" size={18} /></span><span className="grow">Mes factures</span><Icon name="chevron" size={18} /></Link></li>
            <li><Link to="/app/rdv" className="list-row link-row"><span className="list-icon"><Icon name="calendar" size={18} /></span><span className="grow">Mes rendez-vous</span><Icon name="chevron" size={18} /></Link></li>
            <li><Link to="/app/repas" className="list-row link-row"><span className="list-icon"><Icon name="bike" size={18} /></span><span className="grow">Repas livrés</span><Icon name="chevron" size={18} /></Link></li>
            <li><Link to="/test" className="list-row link-row"><span className="list-icon"><Icon name="heart" size={18} /></span><span className="grow">Refaire le test de vitalité</span><Icon name="chevron" size={18} /></Link></li>
            <li><button type="button" className="list-row link-row" onClick={() => setPwd(true)}><span className="list-icon"><Icon name="settings" size={18} /></span><span className="grow">Changer mon mot de passe</span><Icon name="chevron" size={18} /></button></li>
            <li><button type="button" className="list-row link-row danger" onClick={logout}><span className="list-icon"><Icon name="logout" size={18} /></span><span className="grow">Se déconnecter</span></button></li>
          </ul>
        </Card>
        <Notice icon="leaf">Vos données servent uniquement à votre suivi et ne sont jamais transmises à des tiers. Pour les consulter ou les supprimer, écrivez à Annick.</Notice>
        <p className="auth-legal">Conseils en nutrition et hygiène de vie, ne remplace pas un avis médical.</p>
      </div>
      {pwd ? <PasswordModal onClose={() => setPwd(false)} /> : null}
    </div>
  );
}

export function PasswordModal({ onClose }) {
  const [f, setF] = useState({ current: '', next: '' });
  const { run, busy } = useSubmit(async () => { await post('/auth/password', f); onClose(); }, { success: 'Mot de passe modifié' });
  return (
    <Modal title="Changer mon mot de passe" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={busy} onClick={() => run()}>Enregistrer</Button></>}>
      <div className="stack">
        <Field label="Mot de passe actuel"><PasswordInput autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
        <Field label="Nouveau mot de passe" hint="8 caractères minimum"><PasswordInput autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

export function Fiche() {
  const state = useLoad('/me/profile');
  const [p, setP] = useState(null);
  const [phone, setPhone] = useState('');
  useEffect(() => { if (state.data && !p) { setP(state.data.profile || {}); setPhone(state.data.user.phone || ''); } }, [state.data]);
  const { run, busy } = useSubmit(() => put('/me/profile', { ...profilePayload(p), phone }), { success: 'Fiche enregistrée' });
  return (
    <div className="page">
      <PageHeader title="Ma fiche de renseignements" subtitle="Elle aide Annick à préparer votre bilan" back="/app/profil" />
      <Async state={state}>
        {() => (p ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); run(); }}>
            <Card><Field label="Téléphone / WhatsApp"><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field></Card>
            <ProfileForm value={p} onChange={setP} />
            <Notice icon="leaf">Ces informations sont confidentielles et utilisées uniquement pour votre suivi nutritionnel.</Notice>
            <div className="sticky-actions"><Button type="submit" size="lg" loading={busy} icon="check" className="block">Enregistrer ma fiche</Button></div>
          </form>
        ) : null)}
      </Async>
    </div>
  );
}

export function Factures() {
  const state = useLoad('/me/invoices');
  const [declare, setDeclare] = useState(null);
  const [view, setView] = useState(null);
  return (
    <div className="page">
      <PageHeader title="Mes factures" back="/app/profil" />
      <Async state={state}>
        {({ invoices, payment }) => (
          <div className="stack">
            {invoices.length ? (
              <Card pad={false}>
                <ul className="list">
                  {invoices.map((i) => (
                    <li key={i.id} className="list-row">
                      <div className="grow">
                        <strong>{i.label}</strong>
                        <p className="muted small">{i.number} · {fmtDate(i.issued_at)}</p>
                      </div>
                      <div className="right">
                        <p className="amount">{mga(i.amount_mga)}</p>
                        <StatusBadge map={INVOICE_STATUS} value={i.status} />
                      </div>
                      <div className="row-actions">
                        {i.status === 'en_attente' ? <Button size="sm" onClick={() => setDeclare(i)}>J'ai payé</Button> : null}
                        <Button size="sm" variant="ghost" icon="print" aria-label="Voir la facture" onClick={() => setView(i)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : <Empty icon="invoice" title="Aucune facture pour le moment" />}
            <Card title="Comment payer ?">
              <div className="stack small">
                {payment.mvola ? <p><strong>MVola :</strong> {payment.mvola}</p> : null}
                {payment.orange_money ? <p><strong>Orange Money :</strong> {payment.orange_money}</p> : null}
                {payment.airtel_money ? <p><strong>Airtel Money :</strong> {payment.airtel_money}</p> : null}
                {!payment.mvola && !payment.orange_money && !payment.airtel_money ? <p className="muted">Les numéros de paiement vous sont communiqués par Annick.</p> : null}
                <p className="muted">{payment.instructions}</p>
                <p className="muted">Après votre paiement, touchez « J'ai payé » et indiquez la référence de la transaction. Annick confirme sous 24 h.</p>
              </div>
            </Card>
          </div>
        )}
      </Async>
      {declare ? <DeclareModal invoice={declare} onClose={() => setDeclare(null)} onDone={() => { setDeclare(null); state.reload(); }} /> : null}
      {view ? <InvoiceView invoice={view} onClose={() => setView(null)} /> : null}
    </div>
  );
}

function DeclareModal({ invoice, onClose, onDone }) {
  const [f, setF] = useState({ method: 'mvola', ref: '' });
  const { run, busy } = useSubmit(async () => { await post(`/me/invoices/${invoice.id}/declare`, f); onDone(); }, { success: 'Paiement déclaré, merci !' });
  return (
    <Modal title={`Paiement de ${mga(invoice.amount_mga)}`} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={busy} onClick={() => run()}>Déclarer le paiement</Button></>}>
      <div className="stack">
        <div className="field"><span className="label">Moyen de paiement</span><Pills label="Moyen" options={Object.entries(PAY_METHODS)} value={f.method} onChange={(v) => setF({ ...f, method: v || 'mvola' })} /></div>
        {f.method !== 'especes' ? <Field label="Référence de la transaction" hint="Indiquée dans le SMS de confirmation"><Input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Field> : null}
      </div>
    </Modal>
  );
}

export function InvoiceView({ invoice, onClose, client, cabinet }) {
  const i = invoice;
  return (
    <Modal title={`Facture ${i.number}`} onClose={onClose} wide footer={<Button icon="print" onClick={() => window.print()}>Imprimer / PDF</Button>}>
      <div className="invoice-doc print-area">
        <div className="invoice-top">
          <div><img src="/wordmark.png" alt="Vélona" height="34" /><p className="muted small">{cabinet ? cabinet.address : ''} Antananarivo</p></div>
          <div className="right"><p><strong>Facture {i.number}</strong></p><p className="small">Émise le {fmtDate(i.issued_at)}</p>{i.due_date ? <p className="small">Échéance : {fmtDate(i.due_date)}</p> : null}</div>
        </div>
        {client ? <p className="small"><strong>Client :</strong> {client}</p> : null}
        <table className="table">
          <thead><tr><th>Désignation</th><th className="right">Montant</th></tr></thead>
          <tbody>{(i.items && i.items.length ? i.items : [{ label: i.label, amount_mga: i.amount_mga }]).map((it, k) => <tr key={k}><td>{it.label}</td><td className="right">{mga(it.amount_mga)}</td></tr>)}</tbody>
          <tfoot><tr><th>Total</th><th className="right">{mga(i.amount_mga)}</th></tr></tfoot>
        </table>
        <p className="small">Statut : {INVOICE_STATUS[i.status][0]}{i.paid_at ? ` le ${fmtDate(i.paid_at)}` : ''}{i.method ? ` · ${PAY_METHODS[i.method]}` : ''}{i.payment_ref ? ` · réf. ${i.payment_ref}` : ''}</p>
        <p className="muted small">Vélona · Nutrition & hygiène de vie · Conseils en nutrition, ne remplace pas un avis médical.</p>
      </div>
    </Modal>
  );
}
