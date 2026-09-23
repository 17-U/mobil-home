import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ContactCard from '@/components/ContactCard';
import SocialLinks from '@/components/SocialLinks';
import SafeImage from '@/components/SafeImage';
import HeroImage from '@/components/HeroImage';
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

  const heroImages = [
    ...featured.items.filter((p) => p.condition === 'neuf').map((p) => p.image),
    ...newModels.items.map((p) => p.image),
  ].filter(Boolean);
  const featuredUsed = featured.items.filter((p) => p.condition === 'occasion').slice(0, 3);
  const featuredPieces = featured.items.filter((p) => p.condition === 'piece').slice(0, 3);
  const piecesCategory = categories.find((c) => c.slug === 'pieces-detachees');
  const deposit = Math.round(settings.depositRate * 100);
  const toScale = newModels.items.filter((p) => p.lengthM && p.widthM);

  // Réservoir de photos pour les bandeaux plein cadre (pas de rapport strict avec la section affichée)
  const photoPool = [...featured.items, ...newModels.items].map((p) => p.image).filter(Boolean);
  const poolImages = (offset, count = 3) =>
    photoPool.length ? Array.from({ length: count }, (_, i) => photoPool[(offset + i) % photoPool.length]) : [];
  const piecesCoverIndex = categories.findIndex((c) => c.slug === 'pieces-detachees');
  const piecesImages = [...featuredPieces.map((p) => p.image), covers[piecesCoverIndex]?.image].filter(Boolean);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden bg-pine sm:min-h-[640px]">
        {heroImages.length > 0 && (
          <HeroImage
            srcs={heroImages}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/15" />

        <div className="container-page relative py-16 text-white">
          <h1 className="max-w-3xl text-[2.3rem] uppercase leading-[1.05] sm:text-5xl xl:text-[3.6rem]">
            Vente mobil-homes neufs et d’occasion
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg font-semibold text-sun">
            Sur nos modèles neufs, le prix affiché comprend le transport jusqu’à 100 km, l’installation, les raccordements
            et une terrasse de 2,5 × 4,5 m. Réservez en ligne avec un acompte de {deposit} %.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/categorie/mobil-homes-neufs" className="btn-primary">Découvrir nos mobil-homes</Link>
            <Link href="/categorie/mobil-homes-occasion" className="btn bg-white/10 text-white hover:bg-white/20">
              Voir les occasions
            </Link>
          </div>
          <SocialLinks social={settings.shop.social} className="mt-10" />
        </div>
      </section>

      {/* ---------- Formulaire de contact, à cheval sur le hero ---------- */}
      <div id="contact" className="container-page relative z-10 -mt-20 flex scroll-mt-24 justify-center sm:-mt-24 sm:justify-end">
        <ContactCard className="w-full max-w-sm" />
      </div>

      {/* ---------- Présentation, bandeau photo avec carte qui déborde ---------- */}
      <section className="relative mt-8">
        <div className="relative h-[280px] overflow-hidden bg-pine sm:h-[360px]">
          <HeroImage srcs={poolImages(0)} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-ink/40" />
        </div>
        <div className="container-page relative -mt-20 sm:-mt-28">
          <div className="max-w-2xl rounded-md bg-white p-8 shadow-2xl sm:p-10">
            <h2 className="text-3xl sm:text-4xl">Mobil-Home Store, votre spécialiste vente et installation</h2>
            <p className="mt-4 text-lg text-stone">
              Nous vendons des mobil-homes neufs et d’occasion, avec une garantie de 10 ans sur les modèles neufs.
              La livraison, l’installation et les raccordements sont compris dans le prix affiché jusqu’à 100 km ; au-delà,
              le transport est chiffré sur devis. Retrouvez aussi nos pièces détachées pour l’entretien et la rénovation de
              votre mobil-home.
            </p>
            <a href="#contact" className="btn-primary mt-6 inline-flex">Nous contacter</a>
          </div>
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
                      <SafeImage
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
                      {c.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-white/60">{c.description}</p>
                      )}
                    </div>
                    {/* Le bouton descend depuis le haut de la carte et s'arrête au milieu, au survol */}
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-[260%] justify-center opacity-0 transition-all duration-500 ease-out group-hover:-translate-y-1/2 group-hover:opacity-100">
                      <span className="rounded-full bg-sun px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
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

      {/* ---------- Terrasse sur-mesure et couverture ---------- */}
      <section className="relative">
        <div className="grid sm:grid-cols-2">
          {[
            {
              title: 'Terrasse en bois sur-mesure',
              text: 'Vous souhaitez une terrasse sur-mesure pour profiter de votre mobil-home toute l’année ? Nous réalisons votre terrasse en bois, adaptée à votre emplacement et à vos envies.',
              images: poolImages(3),
            },
            {
              title: 'Couverture de terrasse',
              text: 'Envie de profiter de votre terrasse toute l’année ? Couverte, semi-couverte ou fermée : nous vous accompagnons dans la réalisation d’une couverture sur-mesure.',
              images: poolImages(6),
            },
          ].map((b) => (
            <div key={b.title} className="relative flex min-h-[380px] items-end overflow-hidden bg-pine">
              <HeroImage srcs={b.images} alt="" fill sizes="50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/10" />
              <div className="relative p-8 text-white sm:p-10">
                <h2 className="text-2xl sm:text-3xl">{b.title}</h2>
                <p className="mt-3 max-w-md text-white/85">{b.text}</p>
                <a href="#contact" className="btn mt-5 inline-flex bg-white text-ink hover:bg-sun hover:text-white">
                  Nous contacter
                </a>
              </div>
            </div>
          ))}
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

      {/* ---------- Pièces détachées ---------- */}
      {piecesCategory && (
        <section className="relative overflow-hidden bg-sun text-white">
          <div className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl">
                Magasin de pièces détachées pour mobil-homes
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/90">
                {piecesCategory.description ||
                  `${piecesCategory.count} pièces en catalogue pour l’entretien, la réparation et la rénovation de votre mobil-home.`}
              </p>
              <Link href="/categorie/pieces-detachees" className="btn mt-6 inline-flex bg-pine text-white hover:bg-pine-dark">
                Découvrir nos pièces détachées
              </Link>
            </div>
            {piecesImages.length > 0 && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white/10">
                <HeroImage srcs={piecesImages} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain p-8" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- Financement ---------- */}
      <section className="relative flex min-h-[320px] items-center overflow-hidden bg-pine">
        <HeroImage srcs={poolImages(9)} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="container-page relative py-16 text-white">
          <h2 className="max-w-xl text-3xl sm:text-4xl">Un projet à concrétiser ? Parlons financement</h2>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Vous avez besoin d’un financement pour votre mobil-home ? Contactez-nous, nous étudions avec vous la solution
            la mieux adaptée à votre projet.
          </p>
          <a href="#contact" className="btn-primary mt-6 inline-flex">Nous contacter</a>
        </div>
      </section>

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
