import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { formatPrice, priceLabel, formatSurface } from '@/lib/format';

// Rendu à la demande (les données API restent mises en cache 30 à 300 s)
export const dynamic = 'force-dynamic';

const SCALE_M = 13;

export default async function HomePage() {
  const [settings, categories, featured, newModels] = await Promise.all([
    api('/settings', { revalidate: 300 }),
    api('/categories'),
    api('/products?featured=1&limit=12'),
    api('/products?category=mobil-homes-neufs&sort=surface_desc&limit=40'),
  ]);

  const covers = await Promise.all(
    categories.map((c) => api(`/products?category=${c.slug}&limit=1&featured=${c.slug === 'pieces-detachees' ? 0 : 1}`).then((r) => r.items[0]))
  );

  const heroProduct = featured.items.find((p) => p.condition === 'neuf') || newModels.items[0];
  const featuredUsed = featured.items.filter((p) => p.condition === 'occasion').slice(0, 3);
  const deposit = Math.round(settings.depositRate * 100);
  const toScale = newModels.items.filter((p) => p.lengthM && p.widthM);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative -mt-[5.5rem] flex min-h-[640px] items-end overflow-hidden pt-[5.5rem] sm:min-h-[720px]">
        {heroProduct && (
          <Image
            src={heroProduct.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />

        <div className="container-page relative py-16 text-white">
          <h1 className="max-w-3xl text-[2.3rem] uppercase leading-[1.05] sm:text-5xl xl:text-[3.6rem]">
            Votre mobil-home, livré, installé et raccordé.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg font-semibold text-sun">
            Sur nos modèles neufs, le prix affiché comprend le transport jusqu’à 100 km, l’installation, les raccordements
            et une terrasse de 2,5 × 4,5 m. Réservez en ligne avec un acompte de {deposit} %.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/categorie/mobil-homes-neufs" className="btn-primary">Voir les modèles neufs</Link>
            <Link href="/categorie/mobil-homes-occasion" className="btn bg-white/10 text-white hover:bg-white/20">
              Voir les occasions
            </Link>
          </div>
          {heroProduct && (
            <Link href={`/produit/${heroProduct.slug}`} className="mt-10 flex max-w-sm items-center justify-between gap-4 border-t border-white/20 pt-4 text-sm hover:text-sun">
              <span className="font-semibold">{heroProduct.title}, neuf</span>
              <span className="text-white/70">{priceLabel(heroProduct)}</span>
            </Link>
          )}
        </div>
      </section>

      {/* ---------- Catégories ---------- */}
      <section className="bg-pine py-16 text-white">
        <div className="container-page">
          <h2 className="text-3xl uppercase sm:text-4xl">Que cherchez-vous ?</h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {categories.map((c, i) => (
              <li key={c.slug}>
                <Link href={`/categorie/${c.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-white/5">
                    {covers[i]?.image && (
                      <Image
                        src={covers[i].image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 30vw, 100vw"
                        className={`transition-transform duration-500 group-hover:scale-[1.03] ${c.slug === 'pieces-detachees' ? 'object-contain p-8' : 'object-cover'}`}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="text-xl uppercase text-white">{c.name}</h3>
                      <p className="mt-1 text-white/75">
                        {c.count} {c.slug === 'pieces-detachees' ? 'pièces' : 'modèles'}
                        {c.minPrice ? `, dès ${formatPrice(c.minPrice)}` : ', sur devis'}
                      </p>
                      <span className="mt-4 inline-block rounded-full bg-sun px-4 py-2 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Les découvrir
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Les modèles neufs à l'échelle ---------- */}
      {toScale.length > 0 && (
        <section className="container-page py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl">Les modèles neufs, à la même échelle</h2>
            <p className="mt-4 text-lg text-stone">
              Chaque rectangle est le plan au sol du mobil-home. Comparez les longueurs d’un coup d’œil avant de regarder
              les photos.
            </p>
          </div>

          <ol className="mt-10 divide-y divide-line border-y border-line">
            {toScale.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/produit/${p.slug}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-4 md:grid-cols-[220px_1fr_110px_150px]"
                >
                  <span className="font-semibold group-hover:text-pine">{p.title}</span>
                  <span className="order-last col-span-2 md:order-none md:col-span-1">
                    <span
                      className="block h-4 rounded-[2px] border-[1.5px] border-pine bg-mist transition-colors group-hover:bg-sun-soft sm:h-5"
                      style={{ width: `${(p.lengthM / SCALE_M) * 100}%` }}
                      aria-label={`${p.lengthM} m de long`}
                    />
                  </span>
                  <span className="hidden text-stone md:block">{formatSurface(p.surfaceM2)}</span>
                  <span className="text-right font-semibold">{priceLabel(p)}</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-stone">Largeur totale de l’échelle : 13 m.</p>
        </section>
      )}

      {/* ---------- Occasions ---------- */}
      {featuredUsed.length > 0 && (
        <section className="container-page py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl">Occasions à visiter</h2>
            <Link href="/categorie/mobil-homes-occasion" className="font-semibold text-pine underline underline-offset-4">
              Toutes les occasions
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featuredUsed.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Déroulé d'un achat ---------- */}
      <section className="container-page py-20">
        <h2 className="text-3xl sm:text-4xl">Comment se passe l’achat</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ['Vous réservez en ligne', `Ajoutez le mobil-home au panier et versez un acompte de ${deposit} %. Un modèle d’occasion est retiré de la vente dès la commande.`],
            ['Nous vous rappelons', 'Nous confirmons avec vous l’emplacement, les accès pour le transport et la date d’installation. Le solde est réglé avant la livraison.'],
            ['Livraison et installation', 'Le mobil-home est livré, calé, raccordé et sa terrasse posée. Au-delà de 100 km, le transport est chiffré sur devis.'],
          ].map(([title, text], i) => (
            <li key={title} className="border-t-4 border-sun pt-5">
              <p className="display text-4xl text-pine">{i + 1}</p>
              <h3 className="mt-3 text-xl">{title}</h3>
              <p className="mt-2 text-stone">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
