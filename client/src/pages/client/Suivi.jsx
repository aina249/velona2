import React, { useState } from 'react';
import { post, compressImage } from '../../lib/api';
import { navigate } from '../../lib/router';
import { useLoad, fmtDate, num, METRICS } from '../../lib/util';
import { Async, Button, Card, Field, Input, PageHeader, Pills, Scale, Tabs, Textarea, Empty, useSubmit, Notice } from '../../ui/kit';
import { LineChart } from '../../ui/chart';
import { Icon } from '../../ui/icons';

const SERIES = [
  ['weight', 'Poids', 'kg'], ['waist', 'Tour de taille', 'cm'], ['energy', 'Énergie', '/5'], ['glucose', 'Glycémie', 'g/L'],
];
const SLEEP = { faible: 'Faible', moyen: 'Moyen', bon: 'Bon' };

export default function Suivi() {
  const state = useLoad('/me/checkins');
  const [tab, setTab] = useState('weight');
  return (
    <div className="page">
      <PageHeader title="Mon suivi" subtitle="Vos relevés semaine après semaine" actions={<Button icon="plus" size="sm" onClick={() => navigate('/app/checkin')}>Check-in</Button>} />
      <Async state={state}>
        {({ checkins, program }) => {
          const ordered = checkins.slice().reverse();
          const available = SERIES.filter(([k]) => ordered.some((c) => c[k] !== null));
          const active = available.find(([k]) => k === tab) || available[0];
          if (!checkins.length) return <Empty icon="chart" title="Aucun relevé pour l'instant">Faites votre premier check-in : vos courbes apparaîtront ici.</Empty>;
          const first = ordered.find((c) => c[active[0]] !== null);
          const last = checkins.find((c) => c[active[0]] !== null);
          const target = program && program.metric === active[0] ? program.target_value : null;
          return (
            <div className="stack">
              <Tabs tabs={available.map(([k, l]) => [k, l])} value={active[0]} onChange={setTab} />
              <Card>
                <div className="kpi-row">
                  <div><p className="muted small">Actuel</p><p className="kpi">{num(last[active[0]])} <small>{active[2]}</small></p></div>
                  <div><p className="muted small">Évolution</p><p className="kpi">{last[active[0]] - first[active[0]] > 0 ? '+' : ''}{num(last[active[0]] - first[active[0]])} <small>{active[2]}</small></p></div>
                  {target !== null ? <div><p className="muted small">Objectif</p><p className="kpi">{num(target)} <small>{active[2]}</small></p></div> : null}
                </div>
                <LineChart points={ordered.map((c) => ({ x: c.created_at, y: c[active[0]] }))} target={target} unit={active[2]} label={active[1]} />
              </Card>
              <Card title="Historique des relevés" pad={false}>
                <ul className="list">
                  {checkins.map((c) => (
                    <li key={c.id} className="list-row">
                      <span className="list-icon"><Icon name="calendar" size={18} /></span>
                      <div className="grow">
                        <strong>{fmtDate(c.created_at)}</strong>
                        <p className="muted small">
                          {[c.weight !== null && `${num(c.weight)} kg`, c.waist !== null && `${num(c.waist)} cm`, c.energy && `énergie ${c.energy}/5`, c.sleep && `sommeil ${SLEEP[c.sleep].toLowerCase()}`, c.glucose !== null && `glycémie ${num(c.glucose, 2)} g/L`].filter(Boolean).join(' · ')}
                        </p>
                        {c.review_note ? <p className="review-note"><Icon name="message" size={14} /> {c.review_note}</p> : null}
                      </div>
                      {c.photo ? <img className="thumb" src={`/api/files/${c.photo}`} alt="Photo du repas" loading="lazy" /> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          );
        }}
      </Async>
    </div>
  );
}

export function Checkin() {
  const dash = useLoad('/me/dashboard');
  const [f, setF] = useState({ weight: '', waist: '', energy: null, sleep: null, glucose: '', bp: '', note: '', photo: null });
  const [done, setDone] = useState(false);
  const { run, busy } = useSubmit(async () => { await post('/me/checkins', f); setDone(true); });
  const onPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { setF({ ...f, photo: await compressImage(file) }); } catch (err) { alert(err.message); }
  };
  if (done) {
    return (
      <div className="page center-page">
        <div className="success fade-up">
          <span className="success-icon"><Icon name="check" size={36} /></span>
          <h1>Merci, c'est envoyé !</h1>
          <p className="muted">Annick consulte votre check-in et vous répond si besoin. Rendez-vous la semaine prochaine.</p>
          <Button onClick={() => navigate('/app/suivi')}>Voir mes courbes</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeader title="Check-in de la semaine" subtitle="2 minutes, même si tout n'est pas parfait" back="/app" />
      <Async state={dash}>
        {(d) => {
          const fields = d.checkin_fields || ['weight', 'waist', 'energy', 'sleep'];
          return (
            <form className="stack" onSubmit={(e) => { e.preventDefault(); run(); }}>
              <Card>
                <div className="stack">
                  {fields.includes('weight') ? <Field label="Poids (kg)"><Input inputMode="decimal" placeholder="Ex. 72,3" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></Field> : null}
                  {fields.includes('waist') ? <Field label="Tour de taille (cm)" hint="Mesuré au niveau du nombril"><Input inputMode="decimal" placeholder="Ex. 82" value={f.waist} onChange={(e) => setF({ ...f, waist: e.target.value })} /></Field> : null}
                  {fields.includes('glucose') ? <Field label="Glycémie à jeun (g/L)"><Input inputMode="decimal" placeholder="Ex. 1,05" value={f.glucose} onChange={(e) => setF({ ...f, glucose: e.target.value })} /></Field> : null}
                  {fields.includes('bp') ? <Field label="Tension"><Input placeholder="Ex. 12/8" value={f.bp} onChange={(e) => setF({ ...f, bp: e.target.value })} /></Field> : null}
                  {fields.includes('energy') ? <div className="field"><span className="label">Énergie cette semaine</span><Scale value={f.energy} onChange={(v) => setF({ ...f, energy: v })} /></div> : null}
                  {fields.includes('sleep') ? <div className="field"><span className="label">Sommeil cette semaine</span><Pills label="Sommeil" options={[['faible', 'Faible'], ['moyen', 'Moyen'], ['bon', 'Bon']]} value={f.sleep} onChange={(v) => setF({ ...f, sleep: v })} /></div> : null}
                </div>
              </Card>
              <Card>
                <div className="stack">
                  <div className="field">
                    <span className="label">Photo d'un repas (facultatif)</span>
                    {f.photo ? (
                      <div className="photo-preview"><img src={f.photo} alt="Aperçu du repas" /><button type="button" className="icon-btn" aria-label="Retirer la photo" onClick={() => setF({ ...f, photo: null })}><Icon name="x" /></button></div>
                    ) : (
                      <label className="upload"><Icon name="camera" /><span>Ajouter une photo</span><input type="file" accept="image/*" capture="environment" onChange={onPhoto} /></label>
                    )}
                  </div>
                  <Field label="Un mot pour Annick (facultatif)"><Textarea placeholder="Comment s'est passée votre semaine ?" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
                </div>
              </Card>
              <Notice icon="alert" tone="warn">En cas de malaise ou de symptôme inquiétant, n'attendez pas le check-in : consultez un médecin.</Notice>
              <Button type="submit" size="lg" loading={busy} icon="send" className="block">Envoyer mon check-in</Button>
            </form>
          );
        }}
      </Async>
    </div>
  );
}
