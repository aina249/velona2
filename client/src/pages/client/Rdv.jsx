import React, { useState } from 'react';
import { post } from '../../lib/api';
import { useRoute } from '../../lib/router';
import { useLoad, fmtDateTime, fmtDate, APPT_STATUS } from '../../lib/util';
import { Async, Button, Card, Empty, Field, PageHeader, Pills, StatusBadge, Textarea, useSubmit, Notice } from '../../ui/kit';
import { Icon } from '../../ui/icons';

export default function Rdv() {
  const { query } = useRoute();
  const state = useLoad('/me/appointments');
  const [f, setF] = useState({ kind: 'bilan', format: 'cabinet', date: null, starts_at: null, note: '' });
  const [booked, setBooked] = useState(null);
  const book = useSubmit(async () => {
    const a = await post('/me/appointments', { starts_at: f.starts_at, format: f.format, kind: f.kind, note: f.note });
    setBooked(a); state.reload();
  });
  const cancel = useSubmit(async (id) => { await post(`/me/appointments/${id}/cancel`); state.reload(); }, { success: 'Rendez-vous annulé' });

  return (
    <div className="page">
      <PageHeader title="Rendez-vous" subtitle="Au cabinet ou en visio" back="/app" />
      {query.bienvenue ? <Notice icon="heart"><strong>Bienvenue chez Vélona !</strong> Réservez votre bilan : c'est le point de départ de votre programme.</Notice> : null}
      <Async state={state}>
        {({ appointments, slots }) => {
          const upcoming = appointments.filter((a) => a.status === 'confirme' && new Date(a.starts_at) > new Date());
          const past = appointments.filter((a) => !upcoming.includes(a));
          const dates = [...new Set(slots.map((s) => s.date))];
          const daySlots = slots.filter((s) => s.date === (f.date || dates[0]));
          return (
            <div className="stack">
              {booked ? (
                <Card className="success-card fade-up">
                  <span className="success-icon"><Icon name="check" size={30} /></span>
                  <h2>Rendez-vous confirmé</h2>
                  <p>{fmtDateTime(booked.starts_at)} · {booked.format === 'visio' ? 'en visio (le lien vous sera envoyé)' : 'au cabinet'}</p>
                  <p className="muted small">Un e-mail de confirmation vous a été envoyé.</p>
                  <Button variant="secondary" onClick={() => setBooked(null)}>Fermer</Button>
                </Card>
              ) : null}

              {upcoming.length ? (
                <Card title="À venir" pad={false}>
                  <ul className="list">
                    {upcoming.map((a) => (
                      <li key={a.id} className="list-row">
                        <span className="list-icon"><Icon name={a.format === 'visio' ? 'video' : 'pin'} size={18} /></span>
                        <div className="grow"><strong>{fmtDateTime(a.starts_at)}</strong><p className="muted small">{a.kind === 'bilan' ? 'Bilan nutritionnel' : 'Consultation de suivi'} · {a.format === 'visio' ? 'visio' : 'cabinet'}</p></div>
                        <Button variant="ghost" size="sm" loading={cancel.busy} onClick={() => { if (confirm('Annuler ce rendez-vous ?')) cancel.run(a.id); }}>Annuler</Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Card title="Réserver un créneau">
                <div className="stack">
                  <div className="field"><span className="label">Type de rendez-vous</span>
                    <Pills label="Type" options={[['bilan', 'Bilan (60 min)'], ['suivi', 'Suivi']]} value={f.kind} onChange={(v) => setF({ ...f, kind: v || 'bilan' })} /></div>
                  <div className="field"><span className="label">Format</span>
                    <Pills label="Format" options={[['cabinet', 'Au cabinet'], ['visio', 'En visio']]} value={f.format} onChange={(v) => setF({ ...f, format: v || 'cabinet' })} /></div>
                  {slots.length ? (
                    <>
                      <div className="field"><span className="label">Date</span>
                        <div className="date-strip">
                          {dates.map((d) => {
                            const dt = new Date(d + 'T12:00:00Z');
                            const on = (f.date || dates[0]) === d;
                            return (
                              <button key={d} type="button" className={`date-chip ${on ? 'on' : ''}`} onClick={() => setF({ ...f, date: d, starts_at: null })} aria-pressed={on}>
                                <span>{dt.toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' })}</span>
                                <strong>{dt.getUTCDate()}</strong>
                                <span>{dt.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="field"><span className="label">Horaire</span>
                        <div className="time-grid">
                          {daySlots.map((s) => (
                            <button key={s.starts_at} type="button" className={`time-chip ${f.starts_at === s.starts_at ? 'on' : ''}`} aria-pressed={f.starts_at === s.starts_at} onClick={() => setF({ ...f, starts_at: s.starts_at })}>{s.time.replace(':', 'h')}</button>
                          ))}
                        </div>
                      </div>
                      <Field label="Un mot pour Annick (facultatif)"><Textarea placeholder="Votre objectif, vos questions…" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
                      <Button size="lg" icon="calendar" disabled={!f.starts_at} loading={book.busy} onClick={() => book.run()} className="block">Confirmer le rendez-vous</Button>
                    </>
                  ) : <Empty icon="calendar" title="Aucun créneau disponible pour le moment">Écrivez à Annick dans Messages pour trouver un horaire.</Empty>}
                </div>
              </Card>

              {past.length ? (
                <Card title="Historique" pad={false}>
                  <ul className="list">
                    {past.slice(0, 10).map((a) => (
                      <li key={a.id} className="list-row">
                        <div className="grow"><strong>{fmtDate(a.starts_at)}</strong><p className="muted small">{a.kind === 'bilan' ? 'Bilan' : 'Suivi'}</p></div>
                        <StatusBadge map={APPT_STATUS} value={a.status} />
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          );
        }}
      </Async>
    </div>
  );
}
