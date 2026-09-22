'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';
import { priceLabel } from '@/lib/format';

export default function ProductsAdmin() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', page: 1 });
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    const q = new URLSearchParams();
    if (filters.q) q.set('q', filters.q);
    if (filters.category) q.set('category', filters.category);
    q.set('page', filters.page);
    adminApi(`/products?${q}`).then(setData).catch((e) => setMessage(e.message));
  }, [filters]);

  useEffect(load, [load]);
  useEffect(() => {
    adminApi('/categories').then(setCategories).catch(() => {});
  }, []);

  async function toggle(p, field) {
    await adminApi(`/products/${p.id}`, { method: 'PATCH', body: { [field]: !p[field] } });
    load();
  }

  async function del(p) {
    if (!confirm(`Supprimer « ${p.title} » (${p.reference}) ?`)) return;
    const r = await adminApi(`/products/${p.id}`, { method: 'DELETE' });
    setMessage(r.archived ? `${p.title} figure dans des commandes : il a été retiré de la boutique au lieu d’être supprimé.` : `${p.title} supprimé.`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Produits</h1>
        <Link href="/admin/produits/nouveau" className="btn-primary">Ajouter un produit</Link>
      </div>

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: new FormData(e.currentTarget).get('q'), page: 1 }));
        }}
      >
        <input name="q" type="search" placeholder="Titre, marque, référence" defaultValue={filters.q} className="field max-w-xs" />
        <select className="field max-w-xs" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <button className="btn-ghost py-2.5">Rechercher</button>
      </form>

      {message && <p className="rounded-md bg-white p-3" role="status">{message}</p>}

      <div className="overflow-x-auto rounded-md bg-white">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-line text-sm text-stone">
            <tr>
              <th className="p-3 font-semibold">Produit</th>
              <th className="p-3 font-semibold">Catégorie</th>
              <th className="p-3 font-semibold">Prix</th>
              <th className="p-3 font-semibold">Stock</th>
              <th className="p-3 font-semibold">En ligne</th>
              <th className="p-3 font-semibold">À la une</th>
              <th className="p-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((p) => (
              <tr key={p.id} className={p.isPublished ? '' : 'text-stone'}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image ? <img src={p.image} alt="" className="size-12 rounded-sm object-cover" loading="lazy" /> : <span className="size-12 rounded-sm bg-mist" />}
                    <div>
                      <Link href={`/admin/produits/${p.id}`} className="font-semibold hover:text-pine">{p.title}</Link>
                      <p className="text-sm text-stone">{p.reference}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm">{p.category.name}</td>
                <td className="p-3 whitespace-nowrap">{priceLabel(p)}</td>
                <td className="p-3">
                  {p.stock === null ? <span className="text-sm text-stone">Sur commande</span> : p.soldOut ? <span className="font-semibold text-danger">Réservé</span> : p.stock}
                </td>
                <td className="p-3">
                  <input type="checkbox" className="size-5 accent-pine" checked={p.isPublished} onChange={() => toggle(p, 'isPublished')} aria-label={`Publier ${p.title}`} />
                </td>
                <td className="p-3">
                  <input type="checkbox" className="size-5 accent-pine" checked={p.isFeatured} onChange={() => toggle(p, 'isFeatured')} aria-label={`Mettre ${p.title} à la une`} />
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link href={`/admin/produits/${p.id}`} className="mr-4 font-semibold text-pine">Modifier</Link>
                  <button type="button" onClick={() => del(p)} className="font-semibold text-danger">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.items.length === 0 && <p className="p-6 text-stone">Aucun produit ne correspond à cette recherche.</p>}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center gap-3">
          <button className="btn-ghost py-2" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Précédent</button>
          <span className="text-stone">Page {data.page} sur {data.pages} ({data.total} produits)</span>
          <button className="btn-ghost py-2" disabled={filters.page >= data.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Suivant</button>
        </div>
      )}
    </div>
  );
}
