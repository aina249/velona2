import React, { createContext, useContext, useEffect, useState } from 'react';
import { get, post } from './api';
import { navigate } from './router';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = chargement
  useEffect(() => {
    get('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
    const out = () => setUser(null);
    window.addEventListener('velona:logout', out);
    return () => window.removeEventListener('velona:logout', out);
  }, []);
  const value = {
    user,
    setUser,
    async login(email, password) { const d = await post('/auth/login', { email, password }); setUser(d.user); return d.user; },
    async register(body) { const d = await post('/auth/register', body); setUser(d.user); return d.user; },
    async logout() { try { await post('/auth/logout'); } catch (_) { /* ignore */ } setUser(null); navigate('/connexion'); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
export const homeFor = (u) => (!u ? '/connexion' : u.role === 'admin' ? '/cockpit' : u.role === 'kitchen' ? '/cuisine' : '/app');
