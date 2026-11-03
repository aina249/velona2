import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Icon } from './icons';
import { Link } from '../lib/router';

// ---------- Boutons ----------
export function Button({ variant = 'primary', size, icon, loading, children, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`} disabled={loading || rest.disabled} {...rest} type={rest.type || 'button'}>
      {loading ? <span className="spinner sm" aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
export function ButtonLink({ to, variant = 'primary', icon, children, className = '' }) {
  return <Link to={to} className={`btn btn-${variant} ${className}`}>{icon ? <Icon name={icon} size={18} /> : null}<span>{children}</span></Link>;
}

// ---------- Champs ----------
export function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      {React.isValidElement(children) ? React.cloneElement(children, { id, 'aria-invalid': error ? 'true' : undefined }) : children}
      {hint && !error ? <p className="hint">{hint}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </div>
  );
}
export const Input = (p) => <input className="input" {...p} value={p.value ?? ''} />;
export const Textarea = (p) => <textarea className="input" rows={3} {...p} value={p.value ?? ''} />;
export function Select({ options, placeholder, ...p }) {
  return (
    <select className="input" {...p} value={p.value ?? ''}>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  );
}
// Choix en pastilles (unique ou multiple)
export function Pills({ options, value, onChange, multiple, label }) {
  const isOn = (k) => (multiple ? (value || []).includes(k) : value === k);
  return (
    <div className="pills" role={multiple ? 'group' : 'radiogroup'} aria-label={label}>
      {options.map(([k, l]) => (
        <button type="button" key={k} className={`pill ${isOn(k) ? 'on' : ''}`} role={multiple ? 'checkbox' : 'radio'} aria-checked={isOn(k)}
          onClick={() => {
            if (multiple) onChange(isOn(k) ? value.filter((x) => x !== k) : [...(value || []), k]);
            else onChange(isOn(k) ? null : k);
          }}>
          {l}
        </button>
      ))}
    </div>
  );
}

// ---------- Mise en page ----------
export const Card = ({ title, action, children, className = '', pad = true }) => (
  <section className={`card ${pad ? '' : 'nopad'} ${className}`}>
    {title || action ? <header className="card-head"><h2>{title}</h2>{action}</header> : null}
    {children}
  </section>
);
export const Badge = ({ tone = 'muted', children }) => <span className={`badge badge-${tone}`}>{children}</span>;
export function StatusBadge({ map, value }) {
  const [label, tone] = map[value] || [value, 'muted'];
  return <Badge tone={tone}>{label}</Badge>;
}
export const Avatar = ({ user, src, size = 40 }) => (
  src ? <img className="avatar" src={src} alt="" style={{ width: size, height: size }} />
    : <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{user ? `${(user.first_name || '?')[0]}${(user.last_name || '')[0] || ''}`.toUpperCase() : '?'}</span>
);
export function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="page-head">
      <div className="page-head-main">
        {back ? <Link to={back} className="icon-btn" aria-label="Retour"><Icon name="back" /></Link> : null}
        <div><h1>{title}</h1>{subtitle ? <p className="muted">{subtitle}</p> : null}</div>
      </div>
      {actions ? <div className="page-head-actions">{actions}</div> : null}
    </div>
  );
}
export function Stat({ label, value, sub, icon, tone }) {
  return (
    <div className={`stat ${tone ? 'stat-' + tone : ''}`}>
      {icon ? <span className="stat-icon"><Icon name={icon} /></span> : null}
      <div><p className="stat-label">{label}</p><p className="stat-value">{value}</p>{sub ? <p className="stat-sub">{sub}</p> : null}</div>
    </div>
  );
}
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, l, n]) => (
        <button key={k} role="tab" type="button" aria-selected={value === k} className={`tab ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>
          {l}{n ? <span className="tab-count">{n}</span> : null}
        </button>
      ))}
    </div>
  );
}
export const Empty = ({ icon = 'leaf', title, children }) => (
  <div className="empty"><span className="empty-icon"><Icon name={icon} size={28} /></span><p className="empty-title">{title}</p>{children ? <div className="muted">{children}</div> : null}</div>
);
export const Loading = ({ label = 'Chargement…' }) => <div className="loading" role="status"><span className="spinner" aria-hidden="true" />{label}</div>;
export function ErrorBox({ error, retry }) {
  if (!error) return null;
  return <div className="alert alert-danger" role="alert"><Icon name="alert" size={20} /><span>{error.message || String(error)}</span>{retry ? <Button variant="ghost" size="sm" onClick={retry}>Réessayer</Button> : null}</div>;
}
export const Notice = ({ tone = 'info', icon = 'leaf', children }) => <div className={`alert alert-${tone}`}><Icon name={icon} size={20} /><div>{children}</div></div>;

// Gère les états de chargement d'une ressource useLoad
export function Async({ state, children, label }) {
  if (state.loading && !state.data) return <Loading label={label} />;
  if (state.error && !state.data) return <ErrorBox error={state.error} retry={state.reload} />;
  if (!state.data) return null;
  return children(state.data);
}

// ---------- Fenêtre modale ----------
export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    const focusables = () => el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (el.querySelector('[autofocus]') || focusables()[0] || el).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const f = [...focusables()]; if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); if (prev) prev.focus(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <header className="modal-head"><h2>{title}</h2><button className="icon-btn" type="button" onClick={onClose} aria-label="Fermer"><Icon name="x" /></button></header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

// ---------- Notifications éphémères ----------
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = (message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4000);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{items.map((t) => <div key={t.id} className={`toast toast-${t.tone}`}><Icon name={t.tone === 'danger' ? 'alert' : 'check'} size={18} />{t.message}</div>)}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// Soumission d'un formulaire avec gestion d'erreur
export function useSubmit(fn, { success } = {}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (...args) => {
    setBusy(true); setError(null);
    try {
      const out = await fn(...args);
      if (success) toast(success);
      return out;
    } catch (e) {
      setError(e);
      toast(e.message, 'danger');
      return undefined;
    } finally { setBusy(false); }
  };
  return { run, busy, error, setError };
}

// Barre de progression
export const Progress = ({ value, tone }) => (
  <div className="progress" role="progressbar" aria-valuenow={value ?? 0} aria-valuemin={0} aria-valuemax={100}>
    <div className={`progress-bar ${tone ? 'tone-' + tone : ''}`} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
  </div>
);

// Curseur 1 à 5
export function Scale({ value, onChange, labels = ['Très faible', 'Faible', 'Moyenne', 'Bonne', 'Excellente'] }) {
  return (
    <div className="scale" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={labels[n - 1]} className={`scale-dot ${value >= n ? 'on' : ''}`} onClick={() => onChange(n)}>{n}</button>
      ))}
      <span className="scale-label">{value ? labels[value - 1] : 'Choisissez'}</span>
    </div>
  );
}
