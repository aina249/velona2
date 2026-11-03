import React, { useEffect, useState } from 'react';
import { post } from '../../lib/api';
import { navigate, useRoute } from '../../lib/router';
import { useLoad, relDays, FORMULA_LABELS } from '../../lib/util';
import { Async, Avatar, Badge, Button, Field, Input, Modal, PageHeader, Progress, Tabs, Empty, useSubmit, Notice } from '../../ui/kit';
import { Icon } from '../../ui/icons';

const CHECKIN = { a_jour: ['À jour', 'ok'], en_retard: ['En retard', 'warn'], a_relancer: ['À relancer', 'danger'], sans_programme: ['Sans programme', 'muted'] };

export default function Clients() {
  const { query } = useRoute();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState('tous');
  const [creating, setCreating] = useState(!!query.nouveau);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  const state = useLoad('/admin/clients' + (debounced ? '?q=' + encodeURIComponent(debounced) : ''));
  return (
    <div className="page">
      <PageHeader title="Clients" actions={<Button icon="plus" onClick={() => setCreating(true)}>Nouveau client</Button>} />
      <div className="toolbar">
        <label className="search"><Icon name="search" size={18} /><input type="search" placeholder="Rechercher un nom, un e-mail, un téléphone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un client" /></label>
      </div>
      <Async state={state}>
        {({ clients }) => {
          const counts = { tous: clients.length, a_relancer: clients.filter((c) => c.checkin_status === 'a_relancer').length, repas: clients.filter((c) => c.formula && c.meal_status === 'actif').length, impayes: clients.filter((c) => c.unpaid).length };
          const list = clients.filter((c) => filter === 'tous' || (filter === 'a_relancer' && c.checkin_status === 'a_relancer') || (filter === 'repas' && c.formula && c.meal_status === 'actif') || (filter === 'impayes' && c.unpaid));
          return (
            <div className="stack">
              <Tabs tabs={[['tous', 'Tous', counts.tous], ['a_relancer', 'À relancer', counts.a_relancer], ['repas', 'Repas livrés', counts.repas], ['impayes', 'Impayés', counts.impayes]]} value={filter} onChange={setFilter} />
              {list.length ? (
                <div className="card nopad table-wrap">
                  <table className="table">
                    <thead><tr><th>Client</th><th>Programme</th><th>Progression</th><th>Dernier check-in</th><th>Repas</th><th>Paiement</th></tr></thead>
                    <tbody>
                      {list.map((c) => (
                        <tr key={c.id} className="clickable" onClick={() => navigate(`/cockpit/clients/${c.id}`)}>
                          <td>
                            <a href={`/cockpit/clients/${c.id}`} className="client-cell" onClick={(e) => { e.preventDefault(); navigate(`/cockpit/clients/${c.id}`); }}>
                              <Avatar user={c} size={38} />
                              <span><strong>{c.first_name} {c.last_name}</strong><span className="muted small block">{c.quartier || c.phone || c.email}</span></span>
                            </a>
                          </td>
                          <td>{c.program_kind ? `${c.program_kind} jours` : <span className="muted">—</span>}</td>
                          <td style={{ minWidth: 150 }}>{c.progress !== null ? <div className="mini-progress"><Progress value={c.progress} /><span>{c.progress} %</span></div> : <span className="muted">—</span>}</td>
                          <td><span className="small">{relDays(c.last_checkin)}</span><br /><Badge tone={CHECKIN[c.checkin_status][1]}>{CHECKIN[c.checkin_status][0]}</Badge></td>
                          <td>{c.formula ? <Badge tone={c.meal_status === 'actif' ? 'ok' : 'muted'}>{FORMULA_LABELS[c.formula]}</Badge> : <span className="muted">—</span>}</td>
                          <td>{c.unpaid ? <Badge tone="warn">{c.unpaid} à régler</Badge> : <Badge tone="ok">À jour</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <Empty icon="users" title={debounced ? 'Aucun client trouvé' : 'Aucun client dans cette liste'} />}
            </div>
          );
        }}
      </Async>
      {creating ? <NewClient onClose={() => { setCreating(false); if (query.nouveau) navigate('/cockpit/clients', { replace: true }); }} onCreated={(id) => navigate(`/cockpit/clients/${id}`)} /> : null}
    </div>
  );
}

function NewClient({ onClose, onCreated }) {
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', phone: '', consent: false });
  const [created, setCreated] = useState(null);
  const { run, busy } = useSubmit(async () => setCreated(await post('/admin/clients', f)));
  if (created) {
    return (
      <Modal title="Compte créé" onClose={onClose} footer={<Button onClick={() => onCreated(created.id)}>Ouvrir le dossier</Button>}>
        <div className="stack">
          <p>Transmettez ces identifiants à {f.first_name} (par WhatsApp par exemple). Un nouveau mot de passe lui sera demandé à la première connexion.</p>
          <div className="credentials"><p><span className="muted">E-mail</span><strong>{f.email}</strong></p><p><span className="muted">Mot de passe temporaire</span><strong className="mono">{created.temp_password}</strong></p></div>
          <Button variant="secondary" icon="copy" onClick={() => navigator.clipboard && navigator.clipboard.writeText(`Bonjour ${f.first_name}, votre espace Vélona est prêt : ${location.origin}\nE-mail : ${f.email}\nMot de passe temporaire : ${created.temp_password}`)}>Copier le message</Button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="Nouveau client" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={busy} onClick={() => run()}>Créer le compte</Button></>}>
      <div className="stack">
        <div className="grid-2">
          <Field label="Prénom"><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} autoFocus /></Field>
          <Field label="Nom"><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></Field>
        </div>
        <Field label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Téléphone / WhatsApp"><Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <label className="check"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /><span>Le client a donné son accord pour l'utilisation de ses données dans le cadre de son suivi.</span></label>
        <Notice icon="leaf">Un mot de passe temporaire est généré. Le client complète ensuite sa fiche depuis son espace, ou vous la remplissez avec lui pendant le bilan.</Notice>
      </div>
    </Modal>
  );
}
