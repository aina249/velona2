import React, { useState } from 'react';
import { navigate, useRoute } from '../../lib/router';
import { useLoad, fmtDate, fmtDateTime, relDays, num } from '../../lib/util';
import { Async, Avatar, Badge, Button, Card, Empty, PageHeader, Tabs } from '../../ui/kit';
import { Icon } from '../../ui/icons';
import Chat from '../shared/Chat';
import { ReviewModal } from './Dossier';
import { QUESTIONS } from '../public/Test';

export function Checkins() {
  const [all, setAll] = useState(false);
  const state = useLoad('/admin/checkins' + (all ? '' : '?unreviewed=1'));
  const [review, setReview] = useState(null);
  return (
    <div className="page">
      <PageHeader title="Check-ins" subtitle="Les relevés hebdomadaires de vos clients" />
      <Tabs tabs={[['new', 'À consulter'], ['all', 'Tous']]} value={all ? 'all' : 'new'} onChange={(v) => setAll(v === 'all')} />
      <Async state={state}>
        {({ checkins }) => (checkins.length ? (
          <div className="card nopad">
            <ul className="list">
              {checkins.map((c) => (
                <li key={c.id} className="list-row">
                  <Avatar user={c} size={40} />
                  <div className="grow">
                    <a href={`/cockpit/clients/${c.client_id}?tab=checkins`} onClick={(e) => { e.preventDefault(); navigate(`/cockpit/clients/${c.client_id}?tab=checkins`); }}><strong>{c.first_name} {c.last_name}</strong></a>
                    <span className="muted small"> · {fmtDateTime(c.created_at)}</span>
                    <p className="small">{[c.weight !== null && `${num(c.weight)} kg`, c.waist !== null && `${num(c.waist)} cm`, c.energy && `énergie ${c.energy}/5`, c.sleep && `sommeil ${c.sleep}`, c.glucose !== null && `glycémie ${num(c.glucose, 2)}`].filter(Boolean).join(' · ')}</p>
                    {c.note ? <p className="muted small">« {c.note} »</p> : null}
                  </div>
                  {c.photo ? <img className="thumb" src={`/api/files/${c.photo}`} alt="Photo du repas" loading="lazy" /> : null}
                  {!c.reviewed_at ? <Button size="sm" onClick={() => setReview(c)}>Consulter</Button> : <Badge tone="ok">Consulté</Badge>}
                </li>
              ))}
            </ul>
          </div>
        ) : <Empty icon="check" title={all ? 'Aucun check-in' : 'Tout est consulté'}>Bravo, vous êtes à jour.</Empty>)}
      </Async>
      {review ? <ReviewModal checkin={review} onClose={() => setReview(null)} onDone={() => { setReview(null); state.reload(); }} /> : null}
    </div>
  );
}

export function Conversations() {
  const { query } = useRoute();
  const state = useLoad('/admin/conversations');
  const selected = query.client ? parseInt(query.client, 10) : null;
  return (
    <div className="page">
      <PageHeader title="Messages" />
      <Async state={state}>
        {({ conversations }) => {
          const cur = conversations.find((c) => c.client_id === selected);
          return (
            <div className={`inbox ${selected ? 'has-selection' : ''}`}>
              <div className="card nopad inbox-list">
                {conversations.length ? (
                  <ul className="list">
                    {conversations.map((c) => (
                      <li key={c.client_id}>
                        <button type="button" className={`list-row link-row ${selected === c.client_id ? 'selected' : ''}`} onClick={() => { navigate(`/cockpit/messages?client=${c.client_id}`, { replace: true }); state.setData((d) => ({ ...d, conversations: d.conversations.map((x) => (x.client_id === c.client_id ? { ...x, unread: 0 } : x)) })); }}>
                          <Avatar user={c} size={40} />
                          <div className="grow">
                            <strong>{c.first_name} {c.last_name}</strong>
                            <p className="muted small ellipsis">{c.automatic ? 'Réponse automatique' : c.body}</p>
                          </div>
                          <div className="right">
                            <span className="muted small">{relDays(c.created_at)}</span>
                            {c.unread ? <Badge tone="info">{c.unread}</Badge> : null}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <Empty icon="message" title="Aucune conversation" />}
              </div>
              <div className="card nopad inbox-thread">
                {selected ? (
                  <>
                    <div className="chat-head pad">
                      <button type="button" className="icon-btn inbox-back" aria-label="Retour" onClick={() => navigate('/cockpit/messages', { replace: true })}><Icon name="back" /></button>
                      <strong className="grow">{cur ? `${cur.first_name} ${cur.last_name}` : 'Conversation'}</strong>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/cockpit/clients/${selected}`)}>Dossier</Button>
                    </div>
                    <div className="pad"><Chat path={`/admin/clients/${selected}/messages`} otherName={cur ? cur.first_name : 'le client'} /></div>
                  </>
                ) : <Empty icon="message" title="Choisissez une conversation" />}
              </div>
            </div>
          );
        }}
      </Async>
    </div>
  );
}

export function Leads() {
  const state = useLoad('/admin/leads');
  const [open, setOpen] = useState(null);
  return (
    <div className="page">
      <PageHeader title="Prospects" subtitle="Personnes ayant fait le test de vitalité" />
      <Async state={state}>
        {({ leads }) => (leads.length ? (
          <div className="card nopad table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Personne</th><th>Contact</th><th>Score</th><th>Statut</th></tr></thead>
              <tbody>
                {leads.map((l) => (
                  <React.Fragment key={l.id}>
                    <tr className="clickable" onClick={() => setOpen(open === l.id ? null : l.id)}>
                      <td>{fmtDate(l.created_at, { day: 'numeric', month: 'short' })}</td>
                      <td>{l.client_first_name ? `${l.client_first_name} ${l.client_last_name}` : l.first_name || <span className="muted">Anonyme</span>}</td>
                      <td>{l.contact || <span className="muted">—</span>}</td>
                      <td><strong className={l.score < 50 ? 'text-danger' : ''}>{l.score}</strong>/100</td>
                      <td>{l.user_id ? <Badge tone="ok">Client</Badge> : l.contact ? <Badge tone="warn">À contacter</Badge> : <Badge>Sans contact</Badge>}</td>
                    </tr>
                    {open === l.id ? (
                      <tr><td colSpan={5}>
                        <div className="answers">{QUESTIONS.map((q, i) => <p key={i}><span className="muted">{q.topic}</span><strong>{q.opts[3 - l.answers[i]]}</strong></p>)}</div>
                      </td></tr>
                    ) : null}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon="star" title="Aucun test pour l'instant">Partagez le lien du test de vitalité sur vos réseaux : chaque test apparaît ici.</Empty>)}
      </Async>
    </div>
  );
}
