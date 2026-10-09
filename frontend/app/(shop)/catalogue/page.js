import CatalogView from '@/components/CatalogView';

export const metadata = {
  title: 'Tout le catalogue',
  description:
    'Mobil-homes neufs et d’occasion, abris de jardin et pièces détachées. Garantie 10 ans sur le neuf, livraison et installation incluses jusqu’à 100 km.',
};

export default async function CataloguePage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="container-page pb-10 pt-10 lg:pt-14">
      <header className="mb-10 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">Tout le catalogue</h1>
        <p className="mt-4 text-lg text-stone">
          Mobil-homes neufs garantis 10 ans, mobil-homes d’occasion révisés et garantis 6 mois, abris de jardin et
          pièces détachées. Transport, installation et raccordements compris jusqu’à 100 km sur nos modèles neufs.
        </p>
      </header>
      <CatalogView searchParams={sp} basePath="/catalogue" />
    </div>
  );
}
