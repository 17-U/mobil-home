'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import OrderSummary from '@/components/OrderSummary';

function Confirmation() {
  const { numero } = useParams();
  const search = useSearchParams();
  const email = search.get('email') || '';
  const paiement = search.get('paiement');
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/orders/track?number=${encodeURIComponent(numero)}&email=${encodeURIComponent(email)}`),
      api('/settings'),
    ])
      .then(([o, s]) => (setOrder(o.order), setSettings(s)))
      .catch((e) => setError(e.message));
  }, [numero, email]);

  if (error) {
    return (
      <div className="container-page py-14">
        <h1 className="text-4xl">Commande introuvable</h1>
        <p className="mt-4 text-stone">{error}</p>
        <Link href="/suivi" className="btn-primary mt-6">Suivre une commande</Link>
      </div>
    );
  }
  if (!order) return <div className="container-page min-h-[50vh] py-14 text-stone">Chargement de votre commande…</div>;

  const isQuote = order.type === 'devis';
  return (
    <div className="container-page max-w-4xl py-10 lg:py-14">
      <h1 className="text-4xl sm:text-5xl">{isQuote ? 'Demande de devis envoyée' : 'Merci, votre commande est enregistrée'}</h1>
      <p className="mt-4 text-lg text-stone">
        {isQuote
          ? `Nous revenons vers vous à l’adresse ${order.customer.email} avec un prix.`
          : `Nous vous appelons au ${order.customer.phone} pour organiser la suite.`}{' '}
        Gardez votre numéro de commande pour la suivre en ligne.
      </p>
      {paiement === 'ok' && (
        <p className="mt-6 rounded-md bg-mist p-4 font-medium text-ok">Paiement accepté. L’acompte apparaîtra ici dès sa validation par la banque.</p>
      )}
      {paiement === 'annule' && (
        <p className="mt-6 rounded-md border-l-4 border-danger bg-mist p-4">
          Le paiement par carte n’a pas abouti. Votre commande est conservée : vous pouvez régler l’acompte par virement avec les coordonnées ci-dessous, ou nous appeler.
        </p>
      )}
      <div className="mt-10">
        <OrderSummary order={order} settings={settings} showBank={paiement === 'annule'} />
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
