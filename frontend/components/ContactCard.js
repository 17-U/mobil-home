'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function ContactCard({ className = '' }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus('sending');
    setError('');
    try {
      await api('/contact', { method: 'POST', body: data });
      setStatus('sent');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Une erreur est survenue, réessayez.');
    }
  }

  if (status === 'sent') {
    return (
      <div className={`rounded-md bg-white p-6 text-ink shadow-2xl ${className}`}>
        <p className="text-lg font-bold text-pine">Merci !</p>
        <p className="mt-2 text-stone">Votre demande a bien été envoyée, nous vous recontactons rapidement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`rounded-md bg-white p-6 text-ink shadow-2xl ${className}`}>
      <p className="text-lg font-bold">Besoin d’un renseignement ?</p>
      <div className="mt-4 space-y-3">
        <input name="name" required maxLength={120} placeholder="Nom" className="field" />
        <input name="phone" maxLength={30} placeholder="Téléphone" className="field" />
        <input name="email" type="email" maxLength={160} placeholder="E-mail" className="field" />
        <textarea name="message" maxLength={2000} placeholder="Message" rows={3} className="field resize-none" />
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button type="submit" disabled={status === 'sending'} className="btn-primary mt-4 w-full">
        {status === 'sending' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}
