'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import OrderSummary from '@/components/OrderSummary';

export default function TrackPage() {
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError('');
    setLoading(true);
    try {
      const [o, s] = await Promise.all([
        api(`/orders/track?number=${encodeURIComponent(f.get('number'))}&email=${encodeURIComponent(f.get('email'))}`),
        settings ? Promise.resolve(settings) : api('/settings'),
      ]);
      setOrder(o.order);
      setSettings(s);
    } catch (err) {
      setOrder(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-4xl py-10 lg:py-14">
      <h1 className="text-4xl sm:text-5xl">Suivre une commande</h1>
      <p className="mt-4 text-lg text-stone">Saisissez le numéro reçu à la commande (il commence par MH-) et votre e-mail.</p>

      <form onSubmit={onSubmit} className="mt-8 grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="number" className="label">Numéro de commande</label>
          <input id="number" name="number" required placeholder="MH-260922-AB12" className="field uppercase" />
        </div>
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input id="email" name="email" type="email" required className="field" />
        </div>
        <button className="btn-pine" disabled={loading}>{loading ? 'Recherche…' : 'Afficher'}</button>
      </form>

      {error && <p className="mt-6 rounded-md border-l-4 border-danger bg-mist p-4" role="alert">{error}</p>}
      {order && (
        <div className="mt-12">
          <OrderSummary order={order} settings={settings} />
        </div>
      )}
    </div>
  );
}
