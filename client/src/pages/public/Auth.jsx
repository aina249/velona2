import React, { useState } from 'react';
import { useAuth, homeFor } from '../../lib/auth';
import { Link, navigate, useRoute } from '../../lib/router';
import { Button, Field, Input, PasswordInput, ErrorBox } from '../../ui/kit';
import { post } from '../../lib/api';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand" aria-label="Vélona">
          <img src="/symbol.png" alt="" width="44" height="44" />
          <img src="/wordmark.png" alt="Vélona" height="30" />
        </Link>
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
        {children}
      </div>
      <p className="auth-legal">Conseils en nutrition et hygiène de vie, ne remplace pas un avis médical.</p>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { const u = await login(f.email, f.password); navigate(homeFor(u), { replace: true }); }
    catch (err) { setError(err); }
    finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Bon retour !" subtitle="Connectez-vous à votre espace Vélona.">
      <form onSubmit={submit} className="stack">
        <ErrorBox error={error} />
        <Field label="E-mail"><Input type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Mot de passe"><PasswordInput autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Button type="submit" loading={busy} className="block">Se connecter</Button>
      </form>
      <p className="auth-switch">Pas encore de compte ? <Link to="/inscription">Créer mon compte</Link></p>
      <p className="auth-switch"><Link to="/test">Faire le test de vitalité gratuit</Link></p>
      <p className="hint center">Mot de passe oublié ? Écrivez à Annick : elle vous enverra un mot de passe temporaire.</p>
    </AuthLayout>
  );
}

export function Register() {
  const { register } = useAuth();
  const { query } = useRoute();
  const [f, setF] = useState({ first_name: '', last_name: '', phone: '', email: '', password: '', consent: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const fieldErr = (name) => (error && error.details && error.details.field === name ? error.message : null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await register({ ...f, test_id: query.test ? parseInt(query.test, 10) : undefined });
      navigate('/app/rdv?bienvenue=1', { replace: true });
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Créer mon compte" subtitle="Rejoignez Vélona : bilan, suivi chaque semaine et repas sains livrés.">
      <form onSubmit={submit} className="stack">
        {error && !error.details ? <ErrorBox error={error} /> : null}
        <div className="grid-2">
          <Field label="Prénom" error={fieldErr('prénom')}><Input autoComplete="given-name" required value={f.first_name} onChange={set('first_name')} /></Field>
          <Field label="Nom" error={fieldErr('nom')}><Input autoComplete="family-name" required value={f.last_name} onChange={set('last_name')} /></Field>
        </div>
        <Field label="Téléphone / WhatsApp" error={fieldErr('téléphone')}><Input type="tel" autoComplete="tel" placeholder="+261 34 …" required value={f.phone} onChange={set('phone')} /></Field>
        <Field label="E-mail" error={fieldErr('e-mail')}><Input type="email" autoComplete="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Mot de passe" hint="8 caractères minimum" error={fieldErr('mot de passe')}><PasswordInput autoComplete="new-password" minLength={8} required value={f.password} onChange={set('password')} /></Field>
        <label className={`check ${fieldErr('consentement') ? 'has-error' : ''}`}>
          <input type="checkbox" checked={f.consent} onChange={set('consent')} />
          <span>J'accepte que mes données soient utilisées pour mon suivi nutritionnel. Elles restent confidentielles et ne sont jamais transmises à des tiers.</span>
        </label>
        {fieldErr('consentement') ? <p className="error-text">{fieldErr('consentement')}</p> : null}
        <Button type="submit" loading={busy} className="block">Créer mon compte</Button>
      </form>
      <p className="auth-switch">Déjà un compte ? <Link to="/connexion">Se connecter</Link></p>
    </AuthLayout>
  );
}

// Changement de mot de passe obligatoire (mot de passe temporaire)
export function ForcePassword() {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (f.next !== f.confirm) return setError(new Error('Les deux mots de passe ne correspondent pas'));
    setBusy(true); setError(null);
    try { await post('/auth/password', { current: f.current, next: f.next }); setUser({ ...user, must_change_password: false }); }
    catch (err) { setError(err); }
    finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Choisissez votre mot de passe" subtitle={`Bonjour ${user.first_name}, remplacez le mot de passe temporaire par le vôtre.`}>
      <form onSubmit={submit} className="stack">
        <ErrorBox error={error} />
        <Field label="Mot de passe temporaire"><PasswordInput autoComplete="current-password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
        <Field label="Nouveau mot de passe" hint="8 caractères minimum"><PasswordInput autoComplete="new-password" minLength={8} required value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
        <Field label="Confirmer"><PasswordInput autoComplete="new-password" minLength={8} required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
        <Button type="submit" loading={busy} className="block">Enregistrer</Button>
        <Button variant="ghost" onClick={logout}>Se déconnecter</Button>
      </form>
    </AuthLayout>
  );
}
