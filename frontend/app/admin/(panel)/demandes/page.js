'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';
import { formatDate } from '@/lib/format';

function Leads() {
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const page = Number(params.get('page') || 1);

  function load() {
    adminApi(`/leads?page=${page}`).then(setData).catch((e) => setError(e.message));
  }

  useEffect(load, [page]);

  async function toggleRead(lead) {
    await adminApi(`/leads/${lead.id}`, { method: 'PATCH', body: { isRead: !lead.isRead } });
    load();
  }

  async function remove(lead) {
    if (!confirm('Supprimer cette demande ?')) return;
    await adminApi(`/leads/${lead.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Demandes de contact</h1>

      {error && <p className="text-danger">{error}</p>}

      <div className="space-y-3">
        {data?.items.map((l) => (
          <div key={l.id} className={`rounded-md bg-white p-5 ${l.isRead ? '' : 'ring-2 ring-sun'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {l.name}
                  {!l.isRead && <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-white">Nouveau</span>}
                </p>
                <p className="text-sm text-stone">{formatDate(l.createdAt, true)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost py-2 text-sm" onClick={() => toggleRead(l)}>
                  {l.isRead ? 'Marquer non lu' : 'Marquer lu'}
                </button>
                <button type="button" className="btn-ghost py-2 text-sm text-danger" onClick={() => remove(l)}>
                  Supprimer
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {l.phone && <a className="font-semibold text-pine hover:underline" href={`tel:${l.phone.replace(/\s/g, '')}`}>{l.phone}</a>}
              {l.email && <a className="font-semibold text-pine hover:underline" href={`mailto:${l.email}`}>{l.email}</a>}
            </div>
            {l.message && <p className="mt-3 whitespace-pre-wrap text-ink">{l.message}</p>}
          </div>
        ))}
        {data && data.items.length === 0 && (
          <p className="rounded-md bg-white p-6 text-stone">Aucune demande pour l’instant.</p>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center gap-3">
          <button className="btn-ghost py-2" disabled={page <= 1} onClick={() => router.push(`/admin/demandes?page=${page - 1}`)}>Précédent</button>
          <span className="text-stone">Page {data.page} sur {data.pages}</span>
          <button className="btn-ghost py-2" disabled={page >= data.pages} onClick={() => router.push(`/admin/demandes?page=${page + 1}`)}>Suivant</button>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense>
      <Leads />
    </Suspense>
  );
}
