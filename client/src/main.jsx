import React, { lazy, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, useRoute, matchPath, navigate, Link } from './lib/router';
import { AuthProvider, useAuth, homeFor } from './lib/auth';
import { ToastProvider, Loading } from './ui/kit';
import { Icon } from './ui/icons';
import { Login, Register, ForcePassword } from './pages/public/Auth';
import Test from './pages/public/Test';
import Home from './pages/client/Home';
import Suivi, { Checkin } from './pages/client/Suivi';
import Menus, { Repas } from './pages/client/Menus';
import Rdv from './pages/client/Rdv';
import Profil, { Fiche, Factures } from './pages/client/Profil';
import Chat from './pages/shared/Chat';
import './styles.css';

// Cockpit et cuisine chargés à la demande (allège l'appli client)
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const KitchenApp = lazy(() => import('./pages/kitchen/KitchenApp'));

function ClientMessages() {
  return (
    <div className="page page-chat">
      <div className="chat-head">
        <img src="/annick_face.jpg" alt="" className="avatar" width="44" height="44" />
        <div><strong>Annick Tchuidjang</strong><p className="muted small">Nutritionniste · répond sous 24 h</p></div>
      </div>
      <Chat path="/me/messages" />
    </div>
  );
}

const CLIENT_ROUTES = [
  ['/app', Home], ['/app/suivi', Suivi], ['/app/checkin', Checkin], ['/app/menus', Menus], ['/app/repas', Repas],
  ['/app/rdv', Rdv], ['/app/messages', ClientMessages], ['/app/profil', Profil], ['/app/fiche', Fiche], ['/app/factures', Factures],
];
const NAV = [['/app', 'home', 'Accueil'], ['/app/suivi', 'chart', 'Suivi'], ['/app/menus', 'menu', 'Menus'], ['/app/messages', 'message', 'Messages'], ['/app/profil', 'user', 'Profil']];

function ClientShell() {
  const { path } = useRoute();
  const route = CLIENT_ROUTES.find(([p]) => matchPath(p, path));
  const Page = route ? route[1] : Home;
  const active = (p) => (p === '/app' ? path === '/app' : path.startsWith(p));
  return (
    <div className="client-shell">
      <header className="client-top">
        <Link to="/app" className="brand" aria-label="Vélona, accueil"><img src="/symbol.png" alt="" width="30" height="30" /><img src="/wordmark.png" alt="Vélona" height="22" /></Link>
        <nav className="client-top-nav" aria-label="Navigation">
          {NAV.map(([p, icon, label]) => <Link key={p} to={p} className={active(p) ? 'on' : ''} aria-current={active(p) ? 'page' : undefined}>{label}</Link>)}
        </nav>
      </header>
      <main className="client-main"><Page /></main>
      <nav className="bottom-nav" aria-label="Navigation principale">
        {NAV.map(([p, icon, label]) => (
          <Link key={p} to={p} className={active(p) ? 'on' : ''} aria-current={active(p) ? 'page' : undefined}><Icon name={icon} size={22} /><span>{label}</span></Link>
        ))}
      </nav>
    </div>
  );
}

function Root() {
  const { user } = useAuth();
  const { path } = useRoute();

  useEffect(() => {
    if (user === undefined) return;
    const isPublic = ['/connexion', '/inscription', '/test'].includes(path);
    if (!user && !isPublic) navigate('/connexion', { replace: true });
    else if (user && (path === '/' || path === '/connexion' || path === '/inscription')) navigate(homeFor(user), { replace: true });
    else if (user) {
      const area = path.split('/')[1];
      const allowed = user.role === 'admin' ? ['cockpit', 'cuisine', 'test'] : user.role === 'kitchen' ? ['cuisine'] : ['app', 'test'];
      if (!allowed.includes(area)) navigate(homeFor(user), { replace: true });
    }
  }, [user, path]);

  if (user === undefined) return <div className="boot"><img src="/symbol.png" alt="" width="64" height="64" className="boot-logo" /></div>;
  if (path === '/test') return <Test />;
  if (!user) return path === '/inscription' ? <Register /> : <Login />;
  if (user.must_change_password) return <ForcePassword />;
  const area = path.split('/')[1];
  if (area === 'cockpit' && user.role === 'admin') return <Suspense fallback={<Loading />}><AdminApp /></Suspense>;
  if (area === 'cuisine' && (user.role === 'kitchen' || user.role === 'admin')) return <Suspense fallback={<Loading />}><KitchenApp /></Suspense>;
  if (area === 'app' && user.role === 'client') return <ClientShell />;
  return <Loading />;
}

createRoot(document.getElementById('root')).render(
  <RouterProvider><AuthProvider><ToastProvider><Root /></ToastProvider></AuthProvider></RouterProvider>,
);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
