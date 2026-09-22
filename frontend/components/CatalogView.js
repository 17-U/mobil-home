import { Suspense } from 'react';
import { api } from '@/lib/api';
import ProductCard from './ProductCard';
import CatalogFilters from './CatalogFilters';
import Pagination from './Pagination';

const KEYS = ['brand', 'location', 'bedrooms', 'maxPrice', 'q', 'sort', 'page'];

export default async function CatalogView({ category, searchParams, basePath }) {
  const query = new URLSearchParams();
  if (category) query.set('category', category.slug);
  for (const k of KEYS) if (searchParams[k]) query.set(k, searchParams[k]);
  query.set('limit', '24');

  const [result, facets] = await Promise.all([
    api(`/products?${query}`),
    api(`/products/facets${category ? `?category=${category.slug}` : ''}`),
  ]);

  const cleanParams = Object.fromEntries(KEYS.filter((k) => searchParams[k]).map((k) => [k, searchParams[k]]));

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Suspense>
          <CatalogFilters facets={facets} category={category?.slug} />
        </Suspense>
      </aside>

      <section aria-live="polite">
        <p className="mb-6 text-stone">
          {result.total === 0
            ? 'Aucun produit ne correspond à ces critères.'
            : `${result.total} ${result.total > 1 ? 'produits' : 'produit'}`}
        </p>
        {result.total === 0 ? (
          <div className="rounded-md bg-mist p-8">
            <p className="font-semibold">Élargissez votre recherche</p>
            <p className="mt-1 text-stone">Retirez un filtre ou augmentez le budget pour voir plus de modèles.</p>
          </div>
        ) : (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} priority={i < 3} />
              </li>
            ))}
          </ul>
        )}
        <Pagination page={result.page} pages={result.pages} basePath={basePath} searchParams={cleanParams} />
      </section>
    </div>
  );
}
