import React, { useEffect, useState } from 'react';
import { post, put } from '../../lib/api';
import { navigate } from '../../lib/router';
import { useLoad, todayStr, addDays, fmtDay, fmtTime, APPT_STATUS } from '../../lib/util';
import { Async, Button, Card, Empty, Field, Input, Modal, PageHeader, Pills, Select, StatusBadge, Tabs, useSubmit } from '../../ui/kit';
import { Icon } from '../../ui/icons';

const WEEKDAYS = [[1, 'Lundi'], [2, 'Mardi'], [3, 'Mercredi'], [4, 'Jeudi'], [5, 'Vendredi'], [6, 'Samedi'], [0, 'Dimanche']];

export default function Agenda() {
  const [tab, setTab] = useState('rdv');
  const [from, setFrom] = useState(todayStr());
  const state = useLoad(`/admin/appointments?from=${from}&to=${addDays(from, 13)}`);
  const [creating, setCreating] = useState(false);
  const setStatus = useSubmit(async (id, status) => { await put(`/admin/appointments/${id}`, { status }); state.reload(); }, { success: 'Rendez-vous mis à jour' });
  return (
    <div className="page">
      <PageHeader title="Agenda" actions={<Button icon="plus" onClick={() => setCreating(true)}>Ajouter un rendez-vous</Button>} />
      <Tabs tabs={[['rdv', 'Rendez-vous'], ['horaires', 'Mes horaires']]} value={tab} onChange={setTab} />
      {tab === 'rdv' ? (
        <>
          <div className="week-nav">
            <button type="button" className="icon-btn" aria-label="Période précédente" onClick={() => setFrom(addDays(from, -14))}><Icon name="back" /></button>
            <strong>{fmtDay(from)} → {fmtDay(addDays(from, 13))}</strong>
            <button type="button" className="icon-btn" aria-label="Période suivante" onClick={() => setFrom(addDays(from, 14))}><Icon name="chevron" /></button>
          </div>
          <Async state={state}>
            {({ appointments }) => {
              if (!appointments.length) return <Empty icon="calendar" title="Aucun rendez-vous sur cette période" />;
              const days = [...new Set(appointments.map((a) => fmtDay(a.starts_at)))];
              return days.map((day) => (
                <Card key={day} title={day[0].toUpperCase() + day.slice(1)} pad={false}>
                  <ul className="list">
                    {appointments.filter((a) => fmtDay(a.starts_at) === day).map((a) => (
                      <li key={a.id} className="list-row">
                        <span className="time-badge">{fmtTime(a.starts_at)}</span>
                        <div className="grow">
                          <a href={`/cockpit/clients/${a.client_id}`} onClick={(e) => { e.preventDefault(); navigate(`/cockpit/clients/${a.client_id}`); }}><strong>{a.first_name} {a.last_name}</strong></a>
                          <p className="muted small">{a.kind === 'bilan' ? 'Bilan' : 'Suivi'} · {a.format === 'visio' ? 'visio' : 'cabinet'} · {a.phone || a.email}</p>
                          {a.client_note ? <p className="small">« {a.client_note} »</p> : null}
                        </div>
                        <StatusBadge map={APPT_STATUS} value={a.status} />
                        {a.status === 'confirme' ? (
                          <div className="row-actions">
                            <Button size="sm" variant="secondary" onClick={() => navigate(`/cockpit/clients/${a.client_id}?tab=consultations`)}>Consultation</Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus.run(a.id, 'termine')}>Terminé</Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus.run(a.id, 'absent')}>Absent</Button>
                            <Button size="sm" variant="ghost" onClick={() => { if (confirm('Annuler ce rendez-vous ?')) setStatus.run(a.id, 'annule'); }}>Annuler</Button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Card>
              ));
            }}
          </Async>
        </>
      ) : <Availability />}
      {creating ? <NewAppointment onClose={() => setCreating(false)} onDone={() => { setCreating(false); state.reload(); }} /> : null}
    </div>
  );
}

function NewAppointment({ onClose, onDone }) {
  const clients = useLoad('/admin/clients');
  const [f, setF] = useState({ client_id: '', date: todayStr(), time: '09:00', format: 'cabinet', kind: 'suivi' });
  const { run, busy } = useSubmit(async () => { await post('/admin/appointments', { ...f, client_id: parseInt(f.client_id, 10) }); onDone(); }, { success: 'Rendez-vous ajouté' });
  return (
    <Modal title="Ajouter un rendez-vous" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={busy} disabled={!f.client_id} onClick={() => run()}>Ajouter</Button></>}>
      <div className="stack">
        <Field label="Client"><Select placeholder="Choisir…" options={(clients.data ? clients.data.clients : []).filter((c) => c.active).map((c) => [c.id, `${c.first_name} ${c.last_name}`])} value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })} /></Field>
        <div className="grid-2">
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Heure"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
        </div>
        <div className="field"><span className="label">Type</span><Pills label="Type" options={[['bilan', 'Bilan'], ['suivi', 'Suivi']]} value={f.kind} onChange={(v) => setF({ ...f, kind: v || 'suivi' })} /></div>
        <div className="field"><span className="label">Format</span><Pills label="Format" options={[['cabinet', 'Cabinet'], ['visio', 'Visio']]} value={f.format} onChange={(v) => setF({ ...f, format: v || 'cabinet' })} /></div>
      </div>
    </Modal>
  );
}

function Availability() {
  const state = useLoad('/admin/availability');
  const [rows, setRows] = useState(null);
  useEffect(() => { if (state.data && !rows) setRows(state.data.availability.map((a) => ({ weekday: a.weekday, start_time: a.start_time.slice(0, 5), end_time: a.end_time.slice(0, 5) }))); }, [state.data]);
  const { run, busy } = useSubmit(() => put('/admin/availability', { availability: rows }), { success: 'Horaires enregistrés' });
  if (!rows) return <Async state={state}>{() => null}</Async>;
  return (
    <Card title="Horaires de consultation" action={<Button size="sm" icon="check" loading={busy} onClick={() => run()}>Enregistrer</Button>}>
      <p className="muted small">Les clients réservent sur ces plages, par créneaux (durée réglable dans Paramètres).</p>
      <div className="stack mt">
        {WEEKDAYS.map(([wd, label]) => {
          const list = rows.map((r, i) => ({ ...r, i })).filter((r) => r.weekday === wd);
          return (
            <div key={wd} className="avail-row">
              <strong className="avail-day">{label}</strong>
              <div className="avail-ranges">
                {list.length ? list.map((r) => (
                  <div key={r.i} className="avail-range">
                    <Input type="time" aria-label={`${label} début`} value={r.start_time} onChange={(e) => setRows(rows.map((x, j) => (j === r.i ? { ...x, start_time: e.target.value } : x)))} />
                    <span>→</span>
                    <Input type="time" aria-label={`${label} fin`} value={r.end_time} onChange={(e) => setRows(rows.map((x, j) => (j === r.i ? { ...x, end_time: e.target.value } : x)))} />
                    <button type="button" className="icon-btn" aria-label="Supprimer la plage" onClick={() => setRows(rows.filter((_, j) => j !== r.i))}><Icon name="x" size={18} /></button>
                  </div>
                )) : <span className="muted small">Fermé</span>}
                <button type="button" className="link small" onClick={() => setRows([...rows, { weekday: wd, start_time: '09:00', end_time: '12:00' }])}>+ Ajouter une plage</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
