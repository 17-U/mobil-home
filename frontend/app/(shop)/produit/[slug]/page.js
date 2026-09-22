import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import Footprint from '@/components/Footprint';
import ProductCard from '@/components/ProductCard';
import { priceLabel, formatMeters, formatSurface, locationLabel, formatPrice } from '@/lib/format';

async function getProduct(slug) {
  try {
    return await api(`/products/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return {};
  const p = data.product;
  return {
    title: `${p.title}${p.condition === 'neuf' ? ' neuf' : p.condition === 'occasion' ? ' d’occasion' : ''}`,
    description: [p.statusLabel, priceLabel(p)].filter(Boolean).join('. '),
    openGraph: { images: p.image ? [p.image] : [] },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product: p, related } = data;
  const [settings] = await Promise.all([api('/settings', { revalidate: 300 })]);

  const specs = [
    ['Marque', p.brand],
    ['Modèle', p.model],
    ['Année', p.year],
    ['Fabrication', p.origin],
    ['Dimensions', p.lengthM ? `${formatMeters(p.lengthM)} × ${formatMeters(p.widthM)} m` : null],
    ['Surface', formatSurface(p.surfaceM2)],
    ['Chambres', p.bedrooms],
    ['Couchages', p.sleeps],
    ['Salles d’eau', p.bathrooms],
    ['Où le voir', p.condition === 'occasion' ? locationLabel(p.location) : null],
    ['Référence', p.reference],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  const deposit = !p.onQuote ? Math.round(p.price * settings.depositRate) : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    image: p.images,
    sku: p.reference,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    itemCondition: p.condition === 'neuf' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
    offers: p.onQuote
      ? undefined
      : {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: p.price,
          availability: p.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        },
  };

  return (
    <div className="container-page pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-stone">
        <Link href="/" className="hover:text-pine">Accueil</Link>
        <span className="mx-2">/</span>
        <Link href={`/categorie/${p.category.slug}`} className="hover:text-pine">{p.category.name}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:gap-14">
        <Gallery images={p.images} title={p.title} />

        <div>
          <h1 className="text-4xl sm:text-5xl">{p.title}</h1>
          {p.statusLabel && <p className="mt-3 text-lg text-stone">{p.statusLabel}</p>}

          <div className="mt-6 border-y border-line py-6">
            <p className="display text-4xl">{priceLabel(p)}</p>
            {!p.onQuote && <p className="mt-1 text-stone">TTC</p>}
            {p.availability && <p className="mt-3 font-medium text-pine">{p.availability}</p>}
            {p.priceConditions && (
              <p className="mt-3 rounded-md bg-sun-soft px-4 py-3 text-sm">Le prix comprend {p.priceConditions.replace(/^le prix inclut\s*/i, '')}.</p>
            )}
            {deposit > 0 && !p.soldOut && (
              <p className="mt-3 text-sm text-stone">
                Acompte à la commande : {formatPrice(deposit)}{p.priceFrom ? ' (calculé sur le prix de départ)' : ''}.
              </p>
            )}
            <div className="mt-6">
              <AddToCart product={p} />
            </div>
          </div>

          {p.lengthM && (
            <section className="mt-8">
              <h2 className="text-xl">Plan au sol</h2>
              <Footprint length={p.lengthM} width={p.widthM} surface={p.surfaceM2} size="lg" className="mt-4" />
            </section>
          )}

          {specs.length > 1 && (
            <section className="mt-8">
              <h2 className="text-xl">Caractéristiques</h2>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
                    <dt className="text-stone">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {p.kitchen && (
            <section className="mt-8">
              <h2 className="text-xl">Cuisine équipée</h2>
              <p className="mt-2">{p.kitchen.charAt(0).toUpperCase() + p.kitchen.slice(1)}.</p>
            </section>
          )}

          {p.features.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl">Équipements</h2>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-pine" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.description && (
            <details className="mt-8 rounded-md border border-line p-4">
              <summary className="cursor-pointer font-semibold">Fiche complète</summary>
              <p className="mt-3 whitespace-pre-line text-stone">{p.description}</p>
            </details>
          )}

          {settings.shop?.phone && (
            <p className="mt-8 text-stone">
              Une question sur ce {p.condition === 'piece' ? 'produit' : 'mobil-home'} ? Appelez-nous au{' '}
              <a href={`tel:${settings.shop.phone.replace(/\s/g, '')}`} className="font-semibold text-ink underline underline-offset-4">
                {settings.shop.phone}
              </a>
              , en rappelant la référence {p.reference}.
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-3xl">Modèles proches</h2>
          <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <ProductCard product={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
