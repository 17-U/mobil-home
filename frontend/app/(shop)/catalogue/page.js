import CatalogView from '@/components/CatalogView';

export const metadata = { title: 'Tout le catalogue' };

export default async function CataloguePage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="container-page pb-10 pt-10 lg:pt-14">
      <h1 className="mb-10 text-4xl sm:text-5xl">Tout le catalogue</h1>
      <CatalogView searchParams={sp} basePath="/catalogue" />
    </div>
  );
}
