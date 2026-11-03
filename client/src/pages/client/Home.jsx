import React from 'react';
import { useAuth } from '../../lib/auth';
import { Link } from '../../lib/router';
import { useLoad, fmtDateTime, fmtDay, mga, num, METRICS, FORMULA_LABELS } from '../../lib/util';
import { Async, ButtonLink, Card, Progress, Badge, Notice } from '../../ui/kit';
import { LineChart } from '../../ui/chart';
import { Icon } from '../../ui/icons';

export default function Home() {
  const { user } = useAuth();
  const state = useLoad('/me/dashboard');
  return (
    <div className="page client-home">
      <div className="hello">
        <div>
          <p className="muted">Bonjour,</p>
          <h1>{user.first_name}</h1>
        </div>
        <Link to="/app/messages" className="icon-btn" aria-label="Messages"><Icon name="bell" /></Link>
      </div>
      <Async state={state}>
        {(d) => {
          const p = d.program;
          const metric = p ? METRICS[p.metric] : METRICS.weight;
          const points = d.checkins.map((c) => ({ x: c.created_at, y: c[p ? p.metric : 'weight'] }));
          return (
            <div className="stack">
              {d.checkin_due ? (
                <Link to="/app/checkin" className="cta-card fade-up">
                  <span className="cta-icon"><Icon name="check" /></span>
                  <div><strong>Votre check-in de la semaine</strong><p>{d.days_since_checkin === null ? '2 minutes pour noter vos premières mesures' : `Dernier relevé ${d.days_since_checkin === 0 ? "aujourd'hui" : `il y a ${d.days_since_checkin} jours`}`}</p></div>
                  <Icon name="chevron" />
                </Link>
              ) : null}

              {p ? (
                <Card className="fade-up">
                  <div className="goal">
                    <span className="goal-icon"><Icon name="star" /></span>
                    <div className="grow">
                      <p className="eyebrow">Objectif en cours · programme {p.kind} jours</p>
                      <p className="goal-title">{p.goal_label}</p>
                      {d.progress ? (
                        <>
                          <Progress value={d.progress.pct} />
                          <p className="muted small">{d.progress.pct} % du chemin · {metric.label.toLowerCase()} actuel {num(d.progress.current)} {metric.unit}{d.progress.change ? ` (${d.progress.change > 0 ? '+' : ''}${num(d.progress.change)} ${metric.unit})` : ''}</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="fade-up welcome-card">
                  <h2>Bienvenue chez Vélona</h2>
                  <p className="muted">Première étape : votre bilan personnalisé avec Annick, au cabinet ou en visio. Elle fixera avec vous votre objectif et votre programme.</p>
                  <ButtonLink to="/app/rdv" icon="calendar">Réserver mon bilan</ButtonLink>
                </Card>
              )}

              {d.checkins.length ? (
                <Card title={`Évolution · ${metric.label.toLowerCase()}`} action={<Link to="/app/suivi" className="link">Détails</Link>}>
                  <LineChart points={points} target={p ? p.target_value : null} unit={metric.unit} height={200} label={metric.label} />
                </Card>
              ) : null}

              <div className="tiles">
                <Link to="/app/rdv" className="tile">
                  <Icon name="calendar" />
                  <strong>Rendez-vous</strong>
                  <span className="muted small">{d.next_appointment ? fmtDateTime(d.next_appointment.starts_at) : 'Aucun prévu'}</span>
                </Link>
                <Link to="/app/repas" className="tile">
                  <Icon name="bike" />
                  <strong>Repas livrés</strong>
                  <span className="muted small">{d.next_delivery ? `${d.next_delivery.count} repas · ${fmtDay(d.next_delivery.delivery_date)}` : d.subscription && d.subscription.status === 'actif' ? FORMULA_LABELS[d.subscription.formula] : 'Découvrir'}</span>
                </Link>
                <Link to="/app/factures" className="tile">
                  <Icon name="invoice" />
                  <strong>Factures</strong>
                  <span className="muted small">{d.pending_invoices.n ? <Badge tone="warn">{mga(d.pending_invoices.total)} à régler</Badge> : 'À jour'}</span>
                </Link>
                <Link to="/app/messages" className="tile">
                  <Icon name="message" />
                  <strong>Messages</strong>
                  <span className="muted small">{d.unread_messages ? <Badge tone="info">{d.unread_messages} nouveau{d.unread_messages > 1 ? 'x' : ''}</Badge> : 'Écrire à Annick'}</span>
                </Link>
              </div>

              <Notice icon="leaf">Une question ? Écrivez à Annick dans <Link to="/app/messages" className="link">Messages</Link>, réponse sous 24 h. En cas de symptôme inquiétant, consultez un médecin.</Notice>
            </div>
          );
        }}
      </Async>
    </div>
  );
}
