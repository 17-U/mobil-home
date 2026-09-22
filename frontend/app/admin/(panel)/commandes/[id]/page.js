'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';
import { formatPrice, formatDate, PAYMENT_LABELS, ORDER_STATUS_LABELS } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';

const ZONES = {
  moins_100: 'À moins de 100 km',
  plus_100: 'À plus de 100 km (transport sur devis)',
  retrait: 'Reste sur son emplacement actuel',
  inconnu: 'À préciser',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [paid, setPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function apply(r) {
    setOrder(r.order);
    setStatus(r.order.status);
    setPaid(String(r.order.paidAmount));
  }

  useEffect(() => {
    adminApi(`/orders/${id}`).then(apply).catch((e) => setError(e.message));
  }, [id]);

  async function save(e) {
    e.preventDefault();
    if (status === 'annulee' && order.status !== 'annulee' && !confirm('Annuler cette commande ? Les mobil-homes d’occasion redeviendront disponibles.')) return;
    setSaving(true);
    setMessage('');
    try {
      const body = { note: note || undefined, paidAmount: Number(paid) || 0 };
      if (status !== order.status) body.status = status;
      apply(await adminApi(`/orders/${id}`, { method: 'PATCH', body }));
      setNote('');
      setMessage('Commande mise à jour.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-danger">{error}</p>;
  if (!order) return <p className="text-stone">Chargement…</p>;
  const c = order.customer;

  return (
    <div className="space-y-6">
      <Link href="/admin/commandes" className="text-sm font-semibold text-pine">Retour aux commandes</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl">{order.number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-stone">{order.type === 'devis' ? 'Demande de devis' : 'Commande'}, le {formatDate(order.createdAt, true)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-md bg-white p-6">
            <h2 className="text-xl">Articles</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {i.image ? <img src={i.image} alt="" className="size-14 rounded-sm object-cover" /> : <span className="size-14 rounded-sm bg-mist" />}
                  <div className="flex-1">
                    {i.productId ? (
                      <Link href={`/admin/produits/${i.productId}`} className="font-semibold hover:text-pine">{i.title}</Link>
                    ) : (
                      <p className="font-semibold">{i.title}</p>
                    )}
                    <p className="text-sm text-stone">{i.reference}, quantité {i.quantity}</p>
                  </div>
                  <p className="font-semibold">{i.unitPrice === null ? 'Sur devis' : formatPrice(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            {order.type === 'commande' && (
              <dl className="mt-4 ml-auto max-w-xs space-y-1 border-t border-line pt-4">
                <div className="flex justify-between font-bold"><dt>Total TTC</dt><dd>{formatPrice(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt>Acompte demandé</dt><dd>{formatPrice(order.depositAmount, { cents: true })}</dd></div>
                <div className="flex justify-between"><dt>Encaissé</dt><dd className={order.paidAmount >= order.depositAmount ? 'font-semibold text-ok' : ''}>{formatPrice(order.paidAmount, { cents: true })}</dd></div>
                <div className="flex justify-between"><dt>Mode</dt><dd>{PAYMENT_LABELS[order.paymentMethod]}</dd></div>
              </dl>
            )}
          </section>

          <section className="grid gap-6 rounded-md bg-white p-6 sm:grid-cols-2">
            <div>
              <h2 className="text-xl">Client</h2>
              <p className="mt-3 font-semibold">{c.firstName} {c.lastName}</p>
              <p><a href={`mailto:${c.email}`} className="text-pine underline underline-offset-2">{c.email}</a></p>
              <p><a href={`tel:${c.phone}`} className="text-pine underline underline-offset-2">{c.phone}</a></p>
            </div>
            <div>
              <h2 className="text-xl">Installation</h2>
              <p className="mt-3">{c.address || 'Adresse non renseignée'}</p>
              <p>{[c.postalCode, c.city].filter(Boolean).join(' ')}</p>
              <p>{c.country}</p>
              {order.type === 'commande' && <p className="mt-2 text-stone">{ZONES[order.deliveryZone]}</p>}
            </div>
            {order.notes && (
              <div className="sm:col-span-2">
                <h3 className="font-bold">Message du client</h3>
                <p className="mt-1 whitespace-pre-line rounded-md bg-mist p-3">{order.notes}</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <form onSubmit={save} className="space-y-4 rounded-md bg-white p-6">
            <h2 className="text-xl">Traitement</h2>
            <div>
              <label htmlFor="status" className="label">Statut</label>
              <select id="status" className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {order.type === 'commande' && (
              <div>
                <label htmlFor="paid" className="label">Montant encaissé (€)</label>
                <input id="paid" type="number" min="0" step="0.01" className="field" value={paid} onChange={(e) => setPaid(e.target.value)} />
              </div>
            )}
            <div>
              <label htmlFor="note" className="label">Note visible par le client</label>
              <textarea id="note" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Livraison prévue le…" />
            </div>
            {message && <p className="rounded-md bg-mist p-3 text-sm" role="status">{message}</p>}
            <button className="btn-pine w-full" disabled={saving}>{saving ? 'Enregistrement…' : 'Mettre à jour'}</button>
          </form>

          <section className="rounded-md bg-white p-6">
            <h2 className="text-xl">Historique</h2>
            <ol className="mt-4 space-y-3">
              {order.events.map((e, i) => (
                <li key={i}>
                  <p className="font-semibold">{ORDER_STATUS_LABELS[e.status] || e.status}</p>
                  <p className="text-sm text-stone">{formatDate(e.createdAt, true)}{e.note ? `, ${e.note}` : ''}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
