import React, { useState } from 'react';
import { useRoute, matchPath, Link } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { Icon } from '../../ui/icons';
import Dashboard from './Dashboard';
import Clients from './Clients';
import Dossier from './Dossier';
import Agenda from './Agenda';
import { Checkins, Conversations, Leads } from './Inbox';
import Meals from './Meals';
import Invoices from './Invoices';
import Settings from './Settings';

const ROUTES = [
  ['/cockpit', Dashboard], ['/cockpit/clients', Clients], ['/cockpit/clients/:id', Dossier], ['/cockpit/agenda', Agenda],
  ['/cockpit/checkins', Checkins], ['/cockpit/messages', Conversations], ['/cockpit/menus', Meals], ['/cockpit/factures', Invoices],
  ['/cockpit/prospects', Leads], ['/cockpit/parametres', Settings],
];
const NAV = [
  ['/cockpit', 'home', 'Tableau de bord'], ['/cockpit/clients', 'users', 'Clients'], ['/cockpit/agenda', 'calendar', 'Agenda'],
  ['/cockpit/checkins', 'check', 'Check-ins'], ['/cockpit/messages', 'message', 'Messages'], ['/cockpit/menus', 'menu', 'Repas & menus'],
  ['/cuisine', 'truck', 'Cuisine & livraisons'], ['/cockpit/factures', 'invoice', 'Facturation'], ['/cockpit/prospects', 'star', 'Prospects'],
  ['/cockpit/parametres', 'settings', 'Paramètres'],
];

export default function AdminApp() {
  const { path } = useRoute();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  let Page = Dashboard; let params = {};
  for (const [p, C] of ROUTES) { const m = matchPath(p, path); if (m) { Page = C; params = m; break; } }
  const active = (p) => (p === '/cockpit' ? path === '/cockpit' : path.startsWith(p));
  return (
    <div className={`admin-shell ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar" aria-label="Menu du cockpit">
        <Link to="/cockpit" className="brand sidebar-brand" aria-label="Vélona, tableau de bord"><img src="/symbol.png" alt="" width="34" height="34" /><img src="/wordmark.png" alt="Vélona" height="24" /></Link>
        <nav>
          {NAV.map(([p, icon, label]) => (
            <Link key={p} to={p} onClick={() => setOpen(false)} className={`side-link ${active(p) ? 'on' : ''}`} aria-current={active(p) ? 'page' : undefined}>
              <Icon name={icon} size={20} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-user"><img src="/annick_face.jpg" alt="" className="avatar" width="38" height="38" /><div><strong>{user.first_name} {user.last_name}</strong><p className="muted small">Nutritionniste</p></div></div>
          <button type="button" className="side-link" onClick={logout}><Icon name="logout" size={20} /><span>Se déconnecter</span></button>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-top">
          <button type="button" className="icon-btn menu-toggle" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="list" /></button>
          <Link to="/cockpit" className="brand admin-top-brand"><img src="/symbol.png" alt="" width="28" height="28" /><img src="/wordmark.png" alt="Vélona" height="20" /></Link>
        </header>
        {open ? <button type="button" className="scrim" aria-label="Fermer le menu" onClick={() => setOpen(false)} /> : null}
        <main className="admin-main"><Page params={params} /></main>
      </div>
    </div>
  );
}
