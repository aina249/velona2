import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

export const TZ = 'Indian/Antananarivo';

// Charge des données et expose { data, error, loading, reload, setData }
export function useLoad(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api('GET', path);
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (e) {
      if (alive.current) setState({ data: null, error: e, loading: false });
    }
  }, [path]);
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load, ...deps]);
  return { ...state, reload: load, setData: (d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })) };
}

export const mga = (n) => (n === null || n === undefined || n === '' ? '—' : `${Number(n).toLocaleString('fr-FR')} MGA`);
export const num = (n, d = 1) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d }));

export function fmtDate(value, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return '—';
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T12:00:00Z') : new Date(value);
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...opts }).format(d);
}
export const fmtShort = (v) => fmtDate(v, { day: 'numeric', month: 'short' });
export const fmtDay = (v) => fmtDate(v, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtTime = (v) => fmtDate(v, { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (v) => fmtDate(v, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return addDays(dateStr, -((d.getUTCDay() + 6) % 7));
}
export function relDays(value) {
  if (!value) return 'jamais';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days} jours`;
}

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const SLOTS = [
  { key: 'petit-dejeuner', label: 'Petit-déjeuner' },
  { key: 'dejeuner', label: 'Déjeuner' },
  { key: 'diner', label: 'Dîner' },
  { key: 'collation', label: 'Collation' },
];
export const slotLabel = (k) => (SLOTS.find((s) => s.key === k) || {}).label || k;
export const FORMULA_LABELS = { essentiel: 'Essentiel', equilibre: 'Équilibre', serenite: 'Sérénité' };
export const FORMULA_DESC = {
  essentiel: '5 repas par semaine · déjeuners du lundi au vendredi',
  equilibre: '10 repas par semaine · déjeuners et dîners du lundi au vendredi',
  serenite: '14 repas par semaine · déjeuners et dîners tous les jours',
};
export const METRICS = { weight: { label: 'Poids', unit: 'kg' }, waist: { label: 'Tour de taille', unit: 'cm' }, glucose: { label: 'Glycémie', unit: 'g/L' } };
export const PAY_METHODS = { mvola: 'MVola', orange_money: 'Orange Money', airtel_money: 'Airtel Money', especes: 'Espèces', virement: 'Virement' };
export const INVOICE_STATUS = { en_attente: ['À régler', 'warn'], declaree: ['Paiement déclaré', 'info'], payee: ['Payée', 'ok'], annulee: ['Annulée', 'muted'] };
export const ORDER_STATUS = { a_preparer: ['À préparer', 'warn'], pret: ['Prêt', 'info'], en_livraison: ['En livraison', 'info'], livre: ['Livré', 'ok'], incident: ['Incident', 'danger'] };
export const APPT_STATUS = { confirme: ['Confirmé', 'info'], termine: ['Terminé', 'ok'], annule: ['Annulé', 'muted'], absent: ['Absent', 'danger'] };
export const CONDITIONS = [
  ['diabete', 'Diabète'], ['hypertension', 'Hypertension'], ['surpoids', 'Surpoids / obésité'], ['digestif', 'Problèmes digestifs'],
  ['grossesse', 'Grossesse / allaitement'], ['cholesterol', 'Cholestérol élevé'], ['anemie', 'Anémie'], ['autre', 'Autre'],
];
export const fullName = (u) => (u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '');
export const initials = (u) => (u ? `${(u.first_name || '?')[0]}${(u.last_name || '')[0] || ''}`.toUpperCase() : '?');
