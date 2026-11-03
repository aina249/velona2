// Routeur minimal basé sur l'historique du navigateur
import React, { createContext, useContext, useEffect, useState } from 'react';

const RouterCtx = createContext({ path: '/', query: {} });

function current() {
  return { path: window.location.pathname, query: Object.fromEntries(new URLSearchParams(window.location.search)) };
}

export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname + window.location.search) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
  window.dispatchEvent(new Event('velona:navigate'));
  window.scrollTo(0, 0);
}

export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(current);
  useEffect(() => {
    const on = () => setLoc(current());
    window.addEventListener('popstate', on);
    window.addEventListener('velona:navigate', on);
    return () => { window.removeEventListener('popstate', on); window.removeEventListener('velona:navigate', on); };
  }, []);
  return <RouterCtx.Provider value={loc}>{children}</RouterCtx.Provider>;
}

export const useRoute = () => useContext(RouterCtx);

// Associe un chemin à un motif "/cockpit/clients/:id"
export function matchPath(pattern, path) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/\/:([a-zA-Z_]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
  const m = path.match(re);
  if (!m) return null;
  const params = {};
  keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
  return params;
}

export function Link({ to, children, className, onClick, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
