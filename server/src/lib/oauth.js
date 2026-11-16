'use strict';

// Connexion sociale sans dépendance externe. Les jetons des fournisseurs ne
// sont jamais conservés : ils servent uniquement à vérifier l'identité puis à
// ouvrir la session Vélona habituelle.
const crypto = require('crypto');
const { config, db, randomToken, sha256 } = require('./core');
const auth = require('./auth');

const PROVIDERS = new Set(['google', 'facebook']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

class OAuthProviderError extends Error {}

function appOrigin() {
  let url;
  try {
    url = new URL(config.appUrl);
  } catch (_) {
    throw new OAuthProviderError('APP_URL est invalide');
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (!['http:', 'https:'].includes(url.protocol) || (url.protocol !== 'https:' && !isLocal)) {
    throw new OAuthProviderError('APP_URL doit utiliser HTTPS hors environnement local');
  }
  return url.origin;
}

function callbackUrl(provider) {
  return new URL(`/api/auth/oauth/${provider}/callback`, `${appOrigin()}/`).toString();
}

function providerConfig(provider) {
  if (!PROVIDERS.has(provider)) return null;
  if (provider === 'google') {
    return {
      id: config.oauth.google.clientId,
      secret: config.oauth.google.clientSecret,
      callback: callbackUrl('google'),
    };
  }
  const graphVersion = /^v\d+\.\d+$/.test(config.oauth.facebook.graphVersion)
    ? config.oauth.facebook.graphVersion
    : 'v27.0';
  return {
    id: config.oauth.facebook.appId,
    secret: config.oauth.facebook.appSecret,
    graphVersion,
    callback: callbackUrl('facebook'),
  };
}

function isConfigured(provider) {
  const cfg = providerConfig(provider);
  return Boolean(cfg && cfg.id && cfg.secret);
}

function availableProviders() {
  return {
    google: isConfigured('google'),
    facebook: isConfigured('facebook'),
  };
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function loginRedirect(res, params = {}) {
  const url = new URL('/connexion', `${appOrigin()}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  redirect(res, url.toString());
}

function tokenEquals(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length || left.length < 32 || left.length > 160) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function authorizationUrl(provider, cfg, state) {
  if (provider === 'google') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: cfg.id,
      redirect_uri: cfg.callback,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    }).toString();
    return url.toString();
  }

  const url = new URL(`https://www.facebook.com/${cfg.graphVersion}/dialog/oauth`);
  url.search = new URLSearchParams({
    client_id: cfg.id,
    redirect_uri: cfg.callback,
    response_type: 'code',
    scope: 'public_profile,email',
    state,
  }).toString();
  return url.toString();
}

async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (_) {
    throw new OAuthProviderError('Le fournisseur OAuth est indisponible');
  }
  let payload = null;
  try { payload = await response.json(); } catch (_) { /* réponse inattendue */ }
  if (!response.ok || !payload || typeof payload !== 'object') {
    throw new OAuthProviderError('Le fournisseur OAuth a refusé la demande');
  }
  return payload;
}

async function googleProfile(cfg, code) {
  const token = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cfg.id,
      client_secret: cfg.secret,
      redirect_uri: cfg.callback,
      grant_type: 'authorization_code',
    }).toString(),
  });
  if (typeof token.access_token !== 'string' || !token.access_token) throw new OAuthProviderError('Jeton Google invalide');
  const profile = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  return {
    subject: String(profile.sub || ''),
    email: String(profile.email || '').toLowerCase(),
    emailVerified: profile.email_verified === true || profile.email_verified === 'true',
  };
}

async function facebookProfile(cfg, code) {
  const tokenUrl = new URL(`https://graph.facebook.com/${cfg.graphVersion}/oauth/access_token`);
  tokenUrl.search = new URLSearchParams({
    client_id: cfg.id,
    client_secret: cfg.secret,
    redirect_uri: cfg.callback,
    code,
  }).toString();
  const token = await fetchJson(tokenUrl.toString());
  if (typeof token.access_token !== 'string' || !token.access_token) throw new OAuthProviderError('Jeton Facebook invalide');

  // Meta recommande appsecret_proof pour sécuriser les appels serveur avec un jeton utilisateur.
  const proof = crypto.createHmac('sha256', cfg.secret).update(token.access_token).digest('hex');
  const profileUrl = new URL(`https://graph.facebook.com/${cfg.graphVersion}/me`);
  profileUrl.search = new URLSearchParams({
    fields: 'id,name,email',
    access_token: token.access_token,
    appsecret_proof: proof,
  }).toString();
  const profile = await fetchJson(profileUrl.toString());
  return {
    subject: String(profile.id || ''),
    email: String(profile.email || '').toLowerCase(),
    // L'API Graph ne renvoie pas un booléen séparé : une adresse obtenue avec
    // la permission « email » est celle du compte Facebook authentifié.
    emailVerified: Boolean(profile.email),
  };
}

async function resolveUser(provider, profile) {
  if (!profile.subject || profile.subject.length > 255 || !profile.emailVerified || !EMAIL_RE.test(profile.email)) {
    return { error: 'email_required' };
  }

  return db.tx(async (t) => {
    const linked = await t.one(
      `SELECT u.* FROM oauth_identities oi
         JOIN users u ON u.id = oi.user_id
        WHERE oi.provider = $1 AND oi.provider_subject = $2
        FOR UPDATE`,
      [provider, profile.subject]
    );
    if (linked) {
      if (!linked.active) return { error: 'account_inactive' };
      await t.query('UPDATE oauth_identities SET last_used_at = now() WHERE provider = $1 AND provider_subject = $2', [provider, profile.subject]);
      return { user: linked };
    }

    // Le compte Vélona doit déjà exister : l'inscription classique recueille
    // le consentement de santé et les coordonnées nécessaires au suivi.
    const user = await t.one('SELECT * FROM users WHERE lower(email) = lower($1) FOR UPDATE', [profile.email]);
    if (!user) return { error: 'account_not_found' };
    if (!user.active) return { error: 'account_inactive' };

    await t.query(
      `INSERT INTO oauth_identities (provider, provider_subject, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider, provider_subject) DO NOTHING`,
      [provider, profile.subject, user.id]
    );
    const resolved = await t.one(
      `SELECT u.* FROM oauth_identities oi
         JOIN users u ON u.id = oi.user_id
        WHERE oi.provider = $1 AND oi.provider_subject = $2`,
      [provider, profile.subject]
    );
    if (!resolved || resolved.id !== user.id) return { error: 'identity_conflict' };
    return { user: resolved };
  });
}

async function start(req, res, provider) {
  if (!PROVIDERS.has(provider) || !isConfigured(provider)) return loginRedirect(res, { oauth_error: 'not_configured' });
  auth.rateLimit(`oauth-start:${auth.clientIp(req)}:${provider}`, 30, 60 * 60 * 1000);
  const cfg = providerConfig(provider);
  const state = randomToken(32);
  await db.query('DELETE FROM oauth_states WHERE expires_at < now()');
  await db.query(
    `INSERT INTO oauth_states (state_hash, provider, expires_at)
     VALUES ($1, $2, now() + interval '10 minutes')`,
    [sha256(state), provider]
  );
  auth.setOAuthStateCookie(res, state);
  redirect(res, authorizationUrl(provider, cfg, state));
}

async function callback(req, res, provider) {
  const cfg = providerConfig(provider);
  if (!cfg || !isConfigured(provider)) return loginRedirect(res, { oauth_error: 'not_configured' });

  const state = req.query.state;
  const cookieState = req.cookies.voauth;
  auth.clearOAuthStateCookie(res);
  if (!tokenEquals(state, cookieState)) return loginRedirect(res, { oauth_error: 'invalid_state' });

  const usedState = await db.one(
    `DELETE FROM oauth_states
      WHERE state_hash = $1 AND provider = $2 AND expires_at > now()
      RETURNING state_hash`,
    [sha256(state), provider]
  );
  if (!usedState) return loginRedirect(res, { oauth_error: 'invalid_state' });
  if (req.query.error) return loginRedirect(res, { oauth_error: 'denied' });

  const code = req.query.code;
  if (typeof code !== 'string' || code.length < 4 || code.length > 4096) return loginRedirect(res, { oauth_error: 'invalid_response' });

  try {
    const profile = provider === 'google'
      ? await googleProfile(cfg, code)
      : await facebookProfile(cfg, code);
    const resolved = await resolveUser(provider, profile);
    if (!resolved.user) return loginRedirect(res, { oauth_error: resolved.error || 'unavailable' });
    await auth.createSession(res, resolved.user.id);
    return loginRedirect(res, { oauth: 'success' });
  } catch (error) {
    console.error(`[oauth:${provider}] ${error.message}`);
    return loginRedirect(res, { oauth_error: 'unavailable' });
  }
}

module.exports = { availableProviders, start, callback };
