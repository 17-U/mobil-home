import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/format';

// L'API plafonne les résultats à 100 par page (voir backend/src/lib/products.js) : on boucle.
async function getAllProducts() {
  const first = await api('/products?limit=100&page=1', { revalidate: 3600 });
  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, i) => api(`/products?limit=100&page=${i + 2}`, { revalidate: 3600 }))
  );
  return [first, ...rest].flatMap((r) => r.items);
}

export default async function sitemap() {
  const [categories, allProducts] = await Promise.all([
    api('/categories', { revalidate: 3600 }),
    getAllProducts(),
  ]);

  const staticRoutes = ['', '/catalogue', '/conditions', '/suivi'].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${SITE_URL}/categorie/${c.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const productRoutes = allProducts.map((p) => ({
    url: `${SITE_URL}/produit/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
