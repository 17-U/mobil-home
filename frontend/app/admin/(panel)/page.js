'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';
import { formatPrice, formatDate } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';

function Kpi({ label, value, hint, href }) {
  const body = (
    <>
      <p className="text-sm text-stone">{label}</p>
      <p className="display mt-2 text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-stone">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-md bg-white p-5 hover:ring-2 hover:ring-pine">{body}</Link>
  ) : (
    <div className="rounded-md bg-white p-5">{body}</div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi('/stats').then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-danger">{error}</p>;
  if (!s) return <p className="text-stone">Chargement…</p>;

  // 30 derniers jours, jours sans commande compris
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const hit = s.last30Days.find((x) => x.day === key);
    return { key, orders: hit?.orders || 0, amount: hit?.amount || 0 };
  });
  const maxAmount = Math.max(...days.map((d) => d.amount), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Tableau de bord</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="À traiter" value={s.orders.toProcess || 0} hint="commandes et devis reçus" href="/admin/commandes?status=nouvelle" />
        <Kpi label="Chiffre d’affaires engagé" value={formatPrice(s.orders.revenue)} hint={`${formatPrice(s.orders.paid)} d’acomptes encaissés`} />
        <Kpi label="Commandes" value={s.orders.total || 0} hint={`dont ${s.orders.quotes || 0} demandes de devis`} href="/admin/commandes" />
        <Kpi label="Produits en ligne" value={s.products.published || 0} hint={`${s.products.reserved || 0} réservés sur ${s.products.total}`} href="/admin/produits" />
        <Kpi label="Demandes de contact" value={s.leads.unread || 0} hint={`${s.leads.total || 0} au total`} href="/admin/demandes" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-md bg-white p-6">
          <h2 className="text-xl">Montant commandé, 30 derniers jours</h2>
          <div className="mt-6 flex h-40 items-end gap-1" role="img" aria-label="Histogramme du montant commandé par jour">
            {days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-[2px] ${d.amount ? 'bg-pine' : 'bg-line'}`}
                  style={{ height: `${d.amount ? Math.max((d.amount / maxAmount) * 100, 4) : 2}%` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-xs text-white group-hover:block">
                  {new Date(d.key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : {formatPrice(d.amount)} ({d.orders})
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md bg-white p-6">
          <h2 className="text-xl">Par statut</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(s.statuses).map(([key]) => {
              const n = s.byStatus.find((b) => b.status === key)?.count || 0;
              return (
                <li key={key} className="flex items-center justify-between">
                  <Link href={`/admin/commandes?status=${key}`}><StatusBadge status={key} /></Link>
                  <span className="font-semibold tabular-nums">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-md bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-sm font-semibold text-pine underline underline-offset-4">Toutes les commandes</Link>
        </div>
        {s.recentOrders.length === 0 ? (
          <p className="mt-4 text-stone">Aucune commande pour l’instant. Elles apparaîtront ici dès le premier achat.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <tbody className="divide-y divide-line">
                {s.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3"><Link href={`/admin/commandes/${o.id}`} className="font-semibold text-pine hover:underline">{o.number}</Link></td>
                    <td className="py-3">{o.customer}</td>
                    <td className="py-3 text-stone">{formatDate(o.createdAt)}</td>
                    <td className="py-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3 text-right font-semibold">{o.type === 'devis' ? 'Devis' : formatPrice(o.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md bg-white p-6">
        <h2 className="text-xl">Catalogue</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {s.byCategory.map((c) => (
            <li key={c.name} className="flex justify-between rounded-md bg-mist px-4 py-3">
              <span>{c.name}</span>
              <span className="font-bold">{c.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
