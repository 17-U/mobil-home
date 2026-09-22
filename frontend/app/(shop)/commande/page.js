'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart, useHydrated } from '@/lib/cart';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

const ZONES = [
  ['moins_100', 'À moins de 100 km de chez nous', 'Transport compris sur les modèles neufs.'],
  ['plus_100', 'À plus de 100 km', 'Le transport vous sera chiffré sur devis.'],
  ['retrait', 'Je le laisse sur son emplacement actuel', 'Pour un mobil-home d’occasion déjà sur un de nos campings.'],
  ['inconnu', 'Je ne sais pas encore', 'Nous en parlerons au téléphone.'],
];

function Field({ id, label, error, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} className={`field ${error ? 'border-danger' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear, sync } = useCart();
  const [settings, setSettings] = useState(null);
  const [check, setCheck] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [payment, setPayment] = useState('virement');
  const [zone, setZone] = useState('moins_100');

  useEffect(() => {
    api('/settings').then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated || !items.length) return;
    api('/cart/check', { method: 'POST', body: { items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) } })
      .then(setCheck)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return <div className="container-page min-h-[50vh] py-14" />;

  if (!items.length) {
    return (
      <div className="container-page py-14">
        <h1 className="text-4xl">Commande</h1>
        <p className="mt-6 text-lg">Votre panier est vide.</p>
        <Link href="/catalogue" className="btn-primary mt-6">Voir le catalogue</Link>
      </div>
    );
  }

  const quoteOnly = items.every((i) => i.price === null);
  const subtotal = check?.subtotal ?? items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
  const deposit = check?.deposit ?? 0;

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError('');
    const f = new FormData(e.currentTarget);
    const body = {
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      customer: {
        firstName: f.get('firstName'),
        lastName: f.get('lastName'),
        email: f.get('email'),
        phone: f.get('phone'),
        address: f.get('address'),
        postalCode: f.get('postalCode'),
        city: f.get('city'),
        country: f.get('country'),
      },
      deliveryZone: zone,
      paymentMethod: quoteOnly ? 'virement' : payment,
      notes: f.get('notes') || undefined,
      acceptTerms: f.get('acceptTerms') === 'on',
    };

    setSending(true);
    try {
      const res = await api('/orders', { method: 'POST', body });
      clear();
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
        return;
      }
      router.push(`/commande/confirmation/${res.order.number}?email=${encodeURIComponent(res.order.customer.email)}`);
    } catch (err) {
      const fields = {};
      for (const fe of err.data?.fields || []) fields[fe.path.split('.').pop()] = fe.message;
      setErrors(fields);
      if (err.data?.details?.length) {
        setFormError(err.data.details.map((d) => d.message).join(' '));
        const fresh = await api('/cart/check', {
          method: 'POST',
          body: { items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) },
        }).catch(() => null);
        if (fresh) (sync(fresh.lines), setCheck(fresh));
      } else {
        setFormError(err.message);
      }
      setSending(false);
    }
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="text-4xl sm:text-5xl">{quoteOnly ? 'Demande de devis' : 'Commande'}</h1>

      <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl">Vos coordonnées</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field id="firstName" label="Prénom" autoComplete="given-name" required error={errors.firstName} />
              <Field id="lastName" label="Nom" autoComplete="family-name" required error={errors.lastName} />
              <Field id="email" label="E-mail" type="email" autoComplete="email" required error={errors.email} />
              <Field id="phone" label="Téléphone" type="tel" autoComplete="tel" required error={errors.phone} />
            </div>
          </section>

          <section>
            <h2 className="text-2xl">{quoteOnly ? 'Adresse de livraison' : 'Lieu d’installation'}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-6">
              <Field id="address" label="Adresse ou nom du camping" autoComplete="street-address" className="sm:col-span-6" error={errors.address} />
              <Field id="postalCode" label="Code postal" autoComplete="postal-code" className="sm:col-span-2" error={errors.postalCode} />
              <Field id="city" label="Ville" autoComplete="address-level2" className="sm:col-span-4" error={errors.city} />
              <Field id="country" label="Pays" autoComplete="country-name" defaultValue="France" className="sm:col-span-3" error={errors.country} />
            </div>

            {!quoteOnly && (
              <fieldset className="mt-8">
                <legend className="label">Distance jusqu’au lieu d’installation</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {ZONES.map(([value, title, help]) => (
                    <label key={value} className={`flex cursor-pointer gap-3 rounded-md border p-4 ${zone === value ? 'border-pine bg-mist' : 'border-line'}`}>
                      <input type="radio" name="zone" value={value} checked={zone === value} onChange={() => setZone(value)} className="mt-1 size-4 accent-pine" />
                      <span>
                        <span className="block font-semibold">{title}</span>
                        <span className="text-sm text-stone">{help}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </section>

          {!quoteOnly && (
            <section>
              <h2 className="text-2xl">Acompte de {formatPrice(deposit, { cents: true })}</h2>
              <p className="mt-2 text-stone">Le solde est réglé avant la livraison.</p>
              <div className="mt-6 space-y-3">
                {[
                  ['virement', 'Virement bancaire', 'Les coordonnées bancaires s’affichent après la commande.'],
                  ...(settings?.stripeEnabled ? [['carte', 'Carte bancaire', 'Paiement sécurisé par Stripe.']] : []),
                  ['rendez_vous', 'Lors d’un rendez-vous', 'Nous vous appelons pour convenir d’une visite.'],
                ].map(([value, title, help]) => (
                  <label key={value} className={`flex cursor-pointer gap-3 rounded-md border p-4 ${payment === value ? 'border-pine bg-mist' : 'border-line'}`}>
                    <input type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} className="mt-1 size-4 accent-pine" />
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="text-sm text-stone">{help}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section>
            <label htmlFor="notes" className="label">Précisions (accès, date souhaitée, pièces recherchées…)</label>
            <textarea id="notes" name="notes" rows={4} maxLength={2000} className="field" />
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-md bg-mist p-6 lg:sticky lg:top-24">
          <h2 className="text-xl">Votre {quoteOnly ? 'demande' : 'commande'}</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>
                  {i.title}
                  {i.quantity > 1 && <span className="text-stone"> × {i.quantity}</span>}
                </span>
                <span className="shrink-0 font-semibold">{i.price === null ? 'Sur devis' : formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {!quoteOnly && (
            <dl className="space-y-1 border-t border-line pt-4">
              <div className="flex justify-between font-bold"><dt>Total TTC</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>À payer maintenant</dt><dd>{formatPrice(deposit, { cents: true })}</dd></div>
            </dl>
          )}

          <label className="flex gap-3 text-sm">
            <input type="checkbox" name="acceptTerms" className="mt-0.5 size-4 shrink-0 accent-pine" />
            <span>
              J’accepte les <Link href="/conditions" target="_blank" className="font-semibold underline underline-offset-2">conditions de vente</Link>.
            </span>
          </label>
          {errors.acceptTerms && <p className="text-sm text-danger">{errors.acceptTerms}</p>}

          {formError && (
            <p className="rounded-md bg-white p-3 text-sm text-danger" role="alert">{formError}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={sending}>
            {sending
              ? 'Envoi en cours…'
              : quoteOnly
                ? 'Envoyer ma demande'
                : payment === 'carte'
                  ? `Payer l’acompte de ${formatPrice(deposit, { cents: true })}`
                  : 'Confirmer la commande'}
          </button>
        </aside>
      </form>
    </div>
  );
}
