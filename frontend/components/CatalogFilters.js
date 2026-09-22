'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { locationLabel } from '@/lib/format';

const SORTS = [
  { value: 'recent', label: 'Sélection' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
  { value: 'surface_desc', label: 'Surface' },
  { value: 'annee_desc', label: 'Année' },
];

const PRICE_STEPS = [10000, 15000, 20000, 30000, 50000, 70000, 90000];

export default function CatalogFilters({ facets, category }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function update(key, value) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const isPieces = category === 'pieces-detachees';
  const active = ['brand', 'location', 'bedrooms', 'maxPrice', 'q'].filter((k) => params.get(k));

  return (
    <form
      className={`space-y-6 transition-opacity ${pending ? 'opacity-60' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        update('q', new FormData(e.currentTarget).get('q'));
      }}
      aria-busy={pending}
    >
      <div>
        <label htmlFor="q" className="label">Rechercher</label>
        <input id="q" name="q" type="search" defaultValue={params.get('q') || ''} placeholder="Marque, modèle, référence" className="field" />
      </div>

      <div>
        <label htmlFor="sort" className="label">Trier par</label>
        <select id="sort" className="field" value={params.get('sort') || 'recent'} onChange={(e) => update('sort', e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {!isPieces && facets.bedrooms?.length > 0 && (
        <fieldset>
          <legend className="label">Chambres</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((n) => {
              const has = facets.bedrooms.some((b) => (n === 4 ? b.value >= 4 : b.value === n));
              if (!has) return null;
              const on = params.get('bedrooms') === String(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update('bedrooms', on ? '' : String(n))}
                  className={`min-w-12 rounded-md border px-3 py-2 font-semibold ${on ? 'border-pine bg-pine text-white' : 'border-line bg-white hover:border-pine'}`}
                >
                  {n === 4 ? '4+' : n}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {!isPieces && facets.price?.max > 0 && (
        <div>
          <label htmlFor="maxPrice" className="label">Budget maximum</label>
          <select id="maxPrice" className="field" value={params.get('maxPrice') || ''} onChange={(e) => update('maxPrice', e.target.value)}>
            <option value="">Tous les prix</option>
            {PRICE_STEPS.filter((p) => p > (facets.price.min || 0) && p < facets.price.max * 1.2).map((p) => (
              <option key={p} value={p}>
                Jusqu’à {p.toLocaleString('fr-FR')} €
              </option>
            ))}
          </select>
        </div>
      )}

      {facets.brands?.length > 1 && (
        <div>
          <label htmlFor="brand" className="label">Marque</label>
          <select id="brand" className="field" value={params.get('brand') || ''} onChange={(e) => update('brand', e.target.value)}>
            <option value="">Toutes les marques</option>
            {facets.brands.map((b) => (
              <option key={b.value} value={b.value}>
                {b.value} ({b.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {facets.locations?.length > 1 && (
        <fieldset>
          <legend className="label">Où le voir</legend>
          <div className="space-y-1.5">
            {facets.locations.map((l) => (
              <label key={l.value} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="location"
                  className="size-4 accent-pine"
                  checked={params.get('location') === l.value}
                  onChange={() => update('location', l.value)}
                />
                <span>{locationLabel(l.value)}</span>
                <span className="text-sm text-stone">{l.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {active.length > 0 && (
        <button
          type="button"
          className="text-sm font-semibold text-pine underline underline-offset-4"
          onClick={() => start(() => router.push(pathname, { scroll: false }))}
        >
          Effacer les filtres
        </button>
      )}
    </form>
  );
}
