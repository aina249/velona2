import React, { useEffect, useState } from 'react';
import { useAuth, homeFor } from '../../lib/auth';
import { Link, navigate, useRoute } from '../../lib/router';
import { Button, Field, Input, PasswordInput, ErrorBox } from '../../ui/kit';
import { get, post } from '../../lib/api';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand" aria-label="Vélona, accueil">
          <img src="/symbol.png" alt="" width="44" height="44" />
          <img src="/wordmark.png" alt="Vélona" height="30" />
        </Link>
        <Link to="/" className="auth-public-link">
          <span aria-hidden="true">←</span>
          Retour au site public
        </Link>
      </header>

      <main className="auth-shell">
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
          {children}
        </div>
      </main>
      <p className="auth-legal">Conseils en nutrition et hygiène de vie, ne remplace pas un avis médical.</p>
    </div>
  );
}

function SocialIcon({ provider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285f4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.3c1.9-1.8 3-4.4 3-7.4Z" />
        <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a6 6 0 0 1-5.7-4.1H3v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#fbbc05" d="M6.3 14a6 6 0 0 1 0-3.9V7.5H3a10 10 0 0 0 0 9.1L6.3 14Z" />
        <path fill="#ea4335" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.8A10 10 0 0 0 3 7.5l3.3 2.6A6 6 0 0 1 12 5.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1877f2" />
      <path fill="#fff" d="M13.4 19v-6h2l.3-2.3h-2.3V9.2c0-.7.2-1.2 1.2-1.2h1.2V5.9c-.2 0-.9-.1-1.7-.1-1.8 0-3 1.1-3 3.1v1.8H9v2.3h2.1v6h2.3Z" />
    </svg>
  );
}

const OAUTH_ERROR_MESSAGES = {
  not_configured: 'Cette connexion sociale n’est pas encore configurée.',
  denied: 'La connexion a été annulée. Vous pouvez réessayer quand vous le souhaitez.',
  invalid_state: 'La demande de connexion a expiré. Relancez la connexion sociale.',
  invalid_response: 'La réponse du fournisseur est invalide. Réessayez dans quelques instants.',
  email_required: 'Votre fournisseur n’a pas transmis d’adresse e-mail vérifiée. Utilisez votre connexion Vélona.',
  account_not_found: 'Créez d’abord votre compte Vélona avec cette adresse e-mail, puis reconnectez-vous avec Google ou Facebook.',
  account_inactive: 'Ce compte Vélona est désactivé. Contactez Annick pour obtenir de l’aide.',
  identity_conflict: 'Cette identité sociale est déjà associée à un autre compte Vélona.',
  unavailable: 'La connexion sociale est momentanément indisponible. Réessayez plus tard.',
};

export function Login() {
  const { login } = useAuth();
  const { query } = useRoute();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [socialMessage, setSocialMessage] = useState('');
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    let alive = true;
    get('/auth/oauth/providers')
      .then((data) => { if (alive) setProviders(data.providers || {}); })
      .catch(() => { if (alive) setProviders({}); });
    return () => { alive = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { const u = await login(f.email, f.password); navigate(homeFor(u), { replace: true }); }
    catch (err) { setError(err); }
    finally { setBusy(false); }
  };
  const startSocialLogin = (provider) => {
    if (providers && !providers[provider]) {
      setSocialMessage(`La connexion avec ${provider === 'google' ? 'Google' : 'Facebook'} n’est pas encore configurée.`);
      return;
    }
    window.location.assign(`/api/auth/oauth/${provider}`);
  };
  const oauthMessage = socialMessage || (query.oauth_error ? OAUTH_ERROR_MESSAGES[query.oauth_error] || OAUTH_ERROR_MESSAGES.unavailable : '');
  return (
    <AuthLayout title="Connexion" subtitle="Bienvenue, heureuse de vous revoir.">
      <div className="auth-social" aria-label="Autres options de connexion">
        <div className="auth-social-actions">
          <button
            type="button"
            className={`auth-social-button${providers && !providers.google ? ' is-unavailable' : ''}`}
            aria-disabled={providers && !providers.google ? 'true' : undefined}
            onClick={() => startSocialLogin('google')}
          >
            <SocialIcon provider="google" />
            <span>Continuer avec Google</span>
          </button>
          <button
            type="button"
            className={`auth-social-button${providers && !providers.facebook ? ' is-unavailable' : ''}`}
            aria-disabled={providers && !providers.facebook ? 'true' : undefined}
            onClick={() => startSocialLogin('facebook')}
          >
            <SocialIcon provider="facebook" />
            <span>Continuer avec Facebook</span>
          </button>
        </div>
        <div className="auth-social-divider"><span>ou continuer avec votre e-mail</span></div>
        {oauthMessage ? <p className="auth-social-message" role="status">{oauthMessage}</p> : null}
      </div>
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
