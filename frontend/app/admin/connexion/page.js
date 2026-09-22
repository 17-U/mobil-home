'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { setToken } from '@/lib/admin';
import { SITE_NAME } from '@/lib/format';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError('');
    try {
      const res = await api('/admin/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password') } });
      setToken(res.token);
      router.replace('/admin');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-md bg-white p-8 shadow-sm">
        <p className="display text-lg text-pine">{SITE_NAME}</p>
        <h1 className="mt-6 text-3xl">Connexion</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="field" />
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
        <button className="btn-pine mt-6 w-full" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </main>
  );
}
