import { api } from '@/lib/api';

export const metadata = { title: 'Conditions de vente' };
export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const settings = await api('/settings', { revalidate: 300 });
  const pct = Math.round(settings.depositRate * 100);
  const sections = [
    ['Prix', 'Les prix sont indiqués en euros TTC. Pour les mobil-homes neufs, et lorsque la fiche le précise pour les occasions, le prix comprend le transport jusqu’à 100 km, l’installation, les raccordements et une terrasse de 2,5 m × 4,5 m. Au-delà de 100 km, le transport fait l’objet d’un devis. Les prix « à partir de » correspondent à la configuration de départ du modèle.'],
    ['Commande et acompte', `La commande est enregistrée en ligne et confirmée à réception d’un acompte de ${pct} % du prix TTC, réglé par virement, par carte bancaire lorsque ce moyen est proposé, ou lors d’un rendez-vous. Le solde est payable avant la livraison.`],
    ['Mobil-homes d’occasion', 'Chaque mobil-home d’occasion est un exemplaire unique, vendu en l’état décrit sur sa fiche. Il est retiré de la vente dès l’enregistrement de la commande. Une visite peut être organisée sur le camping ou le parc indiqué.'],
    ['Mobil-homes neufs', 'Les mobil-homes neufs bénéficient de la garantie constructeur de 10 ans. Les modèles « disponibles à la commande » sont fabriqués sur demande ; le délai vous est communiqué à la confirmation.'],
    ['Pièces détachées', 'Les pièces détachées sont vendues sur devis gratuit. La demande envoyée en ligne ne vous engage pas.'],
    ['Annulation', 'Toute demande d’annulation se fait par écrit. Les conditions de remboursement de l’acompte vous sont précisées lors de la confirmation de commande.'],
    [
      'Droit de rétractation',
      'Conformément à l’article L221-18 du Code de la consommation, vous disposez d’un délai de 14 jours à compter de la commande pour exercer votre droit de rétractation, sans avoir à justifier de motif. Ce délai peut toutefois ne pas s’appliquer aux mobil-homes neufs fabriqués selon vos spécifications ni aux occasions, vendues en l’état en tant qu’exemplaires uniques, conformément à l’article L221-28 du Code de la consommation (point à faire valider juridiquement avant mise en ligne définitive).',
    ],
    [
      'Médiation de la consommation',
      'En cas de litige non résolu directement avec notre service client, vous pouvez recourir gratuitement à un médiateur de la consommation (coordonnées à compléter).',
    ],
    [
      'Données personnelles',
      'Le traitement de vos données personnelles est détaillé dans nos mentions légales.',
    ],
  ];
  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <h1 className="text-4xl sm:text-5xl">Conditions de vente</h1>
      <p className="mt-4 rounded-md bg-sun-soft px-4 py-3 text-sm">
        Les clauses relatives à la rétractation et à la médiation sont en cours de finalisation juridique.
      </p>
      <div className="mt-10 space-y-8">
        {sections.map(([t, p]) => (
          <section key={t}>
            <h2 className="text-2xl">{t}</h2>
            <p className="mt-2 leading-relaxed">{p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
