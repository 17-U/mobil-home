import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import CatalogView from '@/components/CatalogView';
import { SITE_URL } from '@/lib/format';

async function getCategory(slug) {
  const categories = await api('/categories', { revalidate: 300 });
  return categories.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/categorie/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || undefined,
    url: `${SITE_URL}/categorie/${slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/categorie/${slug}` },
      ],
    },
  };

  return (
    <div className="container-page pb-10 pt-10 lg:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-stone">
        <Link href="/" className="hover:text-pine">Accueil</Link>
        <span className="mx-2">/</span>
        <span>{category.name}</span>
      </nav>
      <header className="mb-10 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">{category.name}</h1>
        {category.description && <p className="mt-4 text-lg text-stone">{category.description}</p>}
      </header>
      <CatalogView category={category} searchParams={sp} basePath={`/categorie/${slug}`} />
    </div>
  );
}
