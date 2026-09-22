import Link from 'next/link';
import { api } from '@/lib/api';
import { SITE_NAME } from '@/lib/format';

export default async function Footer() {
  let settings = null;
  try {
    settings = await api('/settings', { revalidate: 300 });
  } catch {}
  const shop = settings?.shop;

  return (
    <footer className="mt-24 bg-pine text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-md">
          <p className="display text-2xl">{SITE_NAME}</p>
          <p className="mt-3 text-white/80">
            Mobil-homes neufs et d’occasion, livrés, installés et raccordés. Pièces détachées sur devis.
          </p>
          {shop && (shop.phone || shop.email) && (
            <p className="mt-5 space-y-1">
              {shop.phone && (
                <a className="block font-semibold hover:text-sun" href={`tel:${shop.phone.replace(/\s/g, '')}`}>
                  {shop.phone}
                </a>
              )}
              {shop.email && (
                <a className="block hover:text-sun" href={`mailto:${shop.email}`}>
                  {shop.email}
                </a>
              )}
            </p>
          )}
        </div>
        <div>
          <p className="font-bold">Catalogue</p>
          <ul className="mt-3 space-y-2 text-white/85">
            <li><Link className="hover:text-sun" href="/categorie/mobil-homes-neufs">Mobil-homes neufs</Link></li>
            <li><Link className="hover:text-sun" href="/categorie/mobil-homes-occasion">Mobil-homes d’occasion</Link></li>
            <li><Link className="hover:text-sun" href="/categorie/pieces-detachees">Pièces détachées</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold">Votre achat</p>
          <ul className="mt-3 space-y-2 text-white/85">
            <li><Link className="hover:text-sun" href="/suivi">Suivre une commande</Link></li>
            <li><Link className="hover:text-sun" href="/conditions">Conditions de vente</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="container-page py-5 text-sm text-white/60">
          © {new Date().getFullYear()} {SITE_NAME}. Prix TTC.
        </p>
      </div>
    </footer>
  );
}
