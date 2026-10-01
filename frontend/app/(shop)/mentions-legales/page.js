import { api } from '@/lib/api';
import { SITE_NAME } from '@/lib/format';

export const metadata = { title: 'Mentions légales' };
export const dynamic = 'force-dynamic';

export default async function LegalNoticePage() {
  let settings = null;
  try {
    settings = await api('/settings', { revalidate: 300 });
  } catch {}
  const shop = settings?.shop;

  const sections = [
    [
      'Éditeur du site',
      <>
        <p className="font-semibold text-sun">À compléter : raison sociale, forme juridique, capital social, adresse du siège, numéro SIRET/RCS.</p>
        {shop?.phone && <p className="mt-2">Téléphone : {shop.phone}</p>}
        {shop?.email && <p>E-mail : {shop.email}</p>}
      </>,
    ],
    [
      'Directeur de la publication',
      <p className="font-semibold text-sun" key="dp">À compléter : nom du responsable de la publication.</p>,
    ],
    [
      'Hébergement',
      <>
        <p>Le site ({SITE_NAME}) est hébergé par :</p>
        <p className="mt-2">Vercel Inc. — <a className="underline" href="https://vercel.com/legal" target="_blank" rel="noreferrer">vercel.com/legal</a></p>
        <p className="mt-2">L'API et les données produits sont hébergées par :</p>
        <p className="mt-1">Contabo GmbH — <a className="underline" href="https://contabo.com/en/legal-notice/" target="_blank" rel="noreferrer">contabo.com/en/legal-notice</a></p>
      </>,
    ],
    [
      'Propriété intellectuelle',
      <p key="pi">L'ensemble des contenus présents sur ce site (textes, photographies, logos) est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation préalable est interdite.</p>,
    ],
    [
      'Données personnelles',
      <p key="rgpd">Les informations recueillies via les formulaires de ce site (commande, contact, suivi) sont destinées exclusivement au traitement de votre demande et ne sont pas cédées à des tiers. Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données, à exercer auprès de l'adresse e-mail ci-dessus.</p>,
    ],
  ];

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <h1 className="text-4xl sm:text-5xl">Mentions légales</h1>
      <p className="mt-4 rounded-md bg-sun-soft px-4 py-3 text-sm">
        Page en cours de finalisation : les informations d'identification de la société seront ajoutées sous peu.
      </p>
      <div className="mt-10 space-y-8">
        {sections.map(([title, content]) => (
          <section key={title}>
            <h2 className="text-2xl">{title}</h2>
            <div className="mt-2 leading-relaxed">{content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
