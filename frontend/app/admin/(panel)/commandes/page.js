'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';

function Orders() {
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const status = params.get('status') || '';
  const type = params.get('type') || '';
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    const s = new URLSearchParams({ page });
    if (status) s.set('status', status);
    if (type) s.set('type', type);
    if (q) s.set('q', q);
    adminApi(`/orders?${s}`).then(setData).catch((e) => setError(e.message));
  }, [status, type, q, page]);

  function setParam(k, v) {
    const s = new URLSearchParams(params.toString());
    if (v) s.set(k, v);
    else s.delete(k);
    if (k !== 'page') s.delete('page');
    router.push(`/admin/commandes?${s}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Commandes</h1>

      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('q', new FormData(e.currentTarget).get('q'));
          }}
        >
          <input name="q" type="search" defaultValue={q} placeholder="Numéro, nom, e-mail, téléphone" className="field w-72" />
        </form>
        <select className="field w-52" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="field w-48" value={type} onChange={(e) => setParam('type', e.target.value)}>
          <option value="">Commandes et devis</option>
          <option value="commande">Commandes</option>
          <option value="devis">Demandes de devis</option>
        </select>
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="overflow-x-auto rounded-md bg-white">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-line text-sm text-stone">
            <tr>
              <th className="p-3 font-semibold">Numéro</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Client</th>
              <th className="p-3 font-semibold">Articles</th>
              <th className="p-3 font-semibold">Montant</th>
              <th className="p-3 font-semibold">Acompte</th>
              <th className="p-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((o) => (
              <tr key={o.id} className="hover:bg-mist/60">
                <td className="p-3">
                  <Link href={`/admin/commandes/${o.id}`} className="font-semibold text-pine hover:underline">{o.number}</Link>
                  {o.type === 'devis' && <span className="ml-2 text-sm text-stone">devis</span>}
                </td>
                <td className="p-3 text-sm">{formatDate(o.createdAt, true)}</td>
                <td className="p-3">
                  <p>{o.customer}</p>
                  <p className="text-sm text-stone">{o.phone}</p>
                </td>
                <td className="p-3">{o.itemCount}</td>
                <td className="p-3 font-semibold">{o.type === 'devis' ? 'Sur devis' : formatPrice(o.subtotal)}</td>
                <td className="p-3 text-sm">
                  {o.depositAmount > 0 ? (
                    <span className={o.paidAmount >= o.depositAmount ? 'font-semibold text-ok' : 'text-stone'}>
                      {o.paidAmount >= o.depositAmount ? 'Payé' : `${formatPrice(o.depositAmount)} attendu`}
                    </span>
                  ) : '–'}
                </td>
                <td className="p-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.items.length === 0 && (
          <p className="p-6 text-stone">{status || q || type ? 'Aucune commande ne correspond à ces filtres.' : 'Aucune commande pour l’instant.'}</p>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center gap-3">
          <button className="btn-ghost py-2" disabled={page <= 1} onClick={() => setParam('page', page - 1)}>Précédent</button>
          <span className="text-stone">Page {data.page} sur {data.pages}</span>
          <button className="btn-ghost py-2" disabled={page >= data.pages} onClick={() => setParam('page', page + 1)}>Suivant</button>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}
