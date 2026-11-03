import React from 'react';
import { useAuth } from '../../lib/auth';
import { Link } from '../../lib/router';
import { useLoad, mga, fmtTime, fmtDay, fmtDate, todayStr, ORDER_STATUS } from '../../lib/util';
import { Async, Card, Stat, Empty, Badge, StatusBadge, ButtonLink } from '../../ui/kit';
import { BarChart } from '../../ui/chart';
import { Icon } from '../../ui/icons';

const ALERT_ICON = { silence: 'clock', poids: 'chart', glycemie: 'drop', paiement: 'invoice', fin_programme: 'star' };
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export default function Dashboard() {
  const { user } = useAuth();
  const state = useLoad('/admin/dashboard');
  const hour = new Date().getHours();
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{hour < 18 ? 'Bonjour' : 'Bonsoir'} {user.first_name}</h1><p className="muted">{fmtDate(todayStr(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        <div className="page-head-actions">
          <ButtonLink to="/cockpit/clients?nouveau=1" icon="plus">Nouveau client</ButtonLink>
        </div>
      </div>
      <Async state={state}>
        {(d) => {
          const k = d.kpis;
          return (
            <div className="stack">
              <div className="grid-4">
                <Stat icon="users" label="Clients actifs" value={k.active_clients} sub="en programme" />
                <Stat icon="check" label="Check-ins cette semaine" value={`${k.checkins_received}/${k.checkins_expected}`} sub={k.unreviewed_checkins ? `${k.unreviewed_checkins} à consulter` : 'tous consultés'} />
                <Stat icon="bike" tone="terra" label="Repas cette semaine" value={k.meals_week} sub="à préparer et livrer" />
                <Stat icon="invoice" tone="terra" label="Encaissé ce mois" value={mga(k.revenue_month)} sub="factures payées" />
              </div>

              <div className="dash-grid">
                <Card title="Alertes" action={<Badge tone={d.alerts.length ? 'warn' : 'ok'}>{d.alerts.length}</Badge>} pad={false}>
                  {d.alerts.length ? (
                    <ul className="list">
                      {d.alerts.slice(0, 8).map((a, i) => (
                        <li key={i}>
                          <Link to={a.type === 'paiement' ? '/cockpit/factures' : `/cockpit/clients/${a.client_id}`} className={`list-row link-row alert-row lvl-${a.level}`}>
                            <span className="list-icon"><Icon name={ALERT_ICON[a.type] || 'alert'} size={18} /></span>
                            <div className="grow"><strong>{a.title}</strong><p className="muted small">{a.client}</p></div>
                            <Icon name="chevron" size={18} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : <Empty icon="check" title="Rien à signaler">Tous vos clients sont à jour.</Empty>}
                </Card>

                <Card title="Rendez-vous des 7 prochains jours" action={<Link to="/cockpit/agenda" className="link">Agenda</Link>} pad={false}>
                  {d.appointments.length ? (
                    <ul className="list">
                      {d.appointments.slice(0, 7).map((a) => (
                        <li key={a.id}>
                          <Link to={`/cockpit/clients/${a.client_id}`} className="list-row link-row">
                            <span className="time-badge">{fmtTime(a.starts_at)}</span>
                            <div className="grow"><strong>{a.first_name} {a.last_name}</strong><p className="muted small">{fmtDay(a.starts_at)} · {a.kind === 'bilan' ? 'Bilan' : 'Suivi'} · {a.format === 'visio' ? 'visio' : 'cabinet'}</p></div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : <Empty icon="calendar" title="Aucun rendez-vous prévu" />}
                </Card>
              </div>

              <div className="dash-grid">
                <Card title="Revenus des 6 derniers mois">
                  <BarChart data={d.revenue.map((r) => ({ label: MONTHS[parseInt(r.month.slice(5), 10) - 1], value: r.total }))} format={(v) => (v >= 1000000 ? `${(v / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M` : `${Math.round(v / 1000)} k`)} />
                </Card>
                <Card title={`Livraisons de demain · ${fmtDay(d.tomorrow_deliveries.date)}`} action={<Link to={`/cuisine?date=${d.tomorrow_deliveries.date}`} className="link">Cuisine</Link>} pad={false}>
                  {d.tomorrow_deliveries.rows.length ? (
                    <ul className="list">
                      {d.tomorrow_deliveries.rows.map((r, i) => (
                        <li key={i} className="list-row">
                          <span className="list-icon"><Icon name="pin" size={18} /></span>
                          <div className="grow"><strong>{r.quartier || 'Quartier non précisé'}</strong><p className="muted small">{r.orders} client{r.orders > 1 ? 's' : ''} · {r.meals} repas</p></div>
                          <StatusBadge map={ORDER_STATUS} value={r.status} />
                        </li>
                      ))}
                    </ul>
                  ) : <Empty icon="truck" title="Aucune livraison demain" />}
                </Card>
              </div>

              <div className="grid-3">
                <Link to="/cockpit/messages" className="tile"><Icon name="message" /><strong>Messages</strong><span className="muted small">{k.unread_messages ? `${k.unread_messages} non lu${k.unread_messages > 1 ? 's' : ''}` : 'Tout est lu'}</span></Link>
                <Link to="/cockpit/checkins" className="tile"><Icon name="check" /><strong>Check-ins</strong><span className="muted small">{k.unreviewed_checkins} à consulter</span></Link>
                <Link to="/cockpit/prospects" className="tile"><Icon name="star" /><strong>Prospects</strong><span className="muted small">{k.new_leads} test{k.new_leads > 1 ? 's' : ''} cette semaine</span></Link>
              </div>
            </div>
          );
        }}
      </Async>
    </div>
  );
}
