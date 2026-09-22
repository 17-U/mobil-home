'use client';

import { api } from './api';

const KEY = 'mh-admin-token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}
export function setToken(t) {
  localStorage.setItem(KEY, t);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}

/** Appel API authentifié ; redirige vers la connexion si la session a expiré. */
export async function adminApi(path, opts = {}) {
  try {
    return await api(`/admin${path}`, { ...opts, token: getToken() });
  } catch (err) {
    if (err.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/admin/connexion';
    }
    throw err;
  }
}
