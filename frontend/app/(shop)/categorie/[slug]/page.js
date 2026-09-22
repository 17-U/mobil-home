import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import CatalogView from '@/components/CatalogView';

async function getCategory(slug) {
  const categories = await api('/categories', { revalidate: 300 });
  return categories.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <div className="container-page pb-10 pt-10 lg:pt-14">
      <header className="mb-10 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">{category.name}</h1>
        {category.description && <p className="mt-4 text-lg text-stone">{category.description}</p>}
      </header>
      <CatalogView category={category} searchParams={sp} basePath={`/categorie/${slug}`} />
    </div>
  );
}
