'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart, useHydrated } from '@/lib/cart';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const hydrated = useHydrated();
  const { items, setQuantity, remove, sync } = useCart();
  const [check, setCheck] = useState(null);
  const [problems, setProblems] = useState([]);

  const key = items.map((i) => `${i.id}:${i.quantity}`).join(',');

  useEffect(() => {
    if (!hydrated || !items.length) return;
    let cancel = false;
    api('/cart/check', { method: 'POST', body: { items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) } })
      .then((res) => {
        if (cancel) return;
        setCheck(res);
        if (res.problems.length) {
          setProblems(res.problems);
          sync(res.lines);
        }
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  if (!hydrated) return <div className="container-page min-h-[50vh] py-14" />;

  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
  const quoteOnly = items.length > 0 && items.every((i) => i.price === null);
  const hasQuote = items.some((i) => i.price === null);

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="text-4xl sm:text-5xl">Panier</h1>

      {problems.length > 0 && (
        <div className="mt-6 rounded-md border-l-4 border-danger bg-mist p-4" role="alert">
          <p className="font-semibold">Votre panier a été mis à jour.</p>
          <ul className="mt-1 text-stone">
            {problems.map((p, i) => <li key={i}>{p.message}</li>)}
          </ul>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10 max-w-xl">
          <p className="text-lg">Votre panier est vide.</p>
          <p className="mt-2 text-stone">Choisissez un mobil-home ou ajoutez des pièces détachées à une demande de devis.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/categorie/mobil-homes-neufs" className="btn-primary">Voir les modèles neufs</Link>
            <Link href="/categorie/mobil-homes-occasion" className="btn-ghost">Voir les occasions</Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.id} className="flex gap-4 py-5 sm:gap-6">
                <Link href={`/produit/${i.slug}`} className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-sm bg-mist sm:w-40">
                  {i.image && <Image src={i.image} alt={i.title} fill sizes="160px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <Link href={`/produit/${i.slug}`} className="text-lg font-bold hover:text-pine">{i.title}</Link>
                    <p className="text-sm text-stone">
                      Réf. {i.reference}
                      {i.condition === 'neuf' ? ', neuf' : i.condition === 'occasion' ? ', occasion (pièce unique)' : ''}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      {i.maxQty > 1 && (
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-stone">Qté</span>
                          <select className="field w-20 py-1.5" value={i.quantity} onChange={(e) => setQuantity(i.id, Number(e.target.value))}>
                            {Array.from({ length: Math.min(i.maxQty, 20) }, (_, n) => n + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      <button type="button" onClick={() => remove(i.id)} className="text-sm font-semibold text-danger underline underline-offset-4">
                        Retirer
                      </button>
                    </div>
                  </div>
                  <p className="font-bold sm:text-right">
                    {i.price === null ? 'Sur devis' : formatPrice(i.price * i.quantity)}
                    {i.priceFrom && <span className="block text-xs font-normal text-stone">prix de départ</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-md bg-mist p-6 lg:sticky lg:top-24">
            <h2 className="text-xl">Récapitulatif</h2>
            {quoteOnly ? (
              <p className="mt-4 text-stone">
                Ces articles sont vendus sur devis. Envoyez votre demande : nous vous répondons avec un prix sans engagement.
              </p>
            ) : (
              <dl className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <dt>Total TTC</dt>
                  <dd className="font-bold">{formatPrice(subtotal)}</dd>
                </div>
                {check && (
                  <div className="flex justify-between text-stone">
                    <dt>Acompte à la commande</dt>
                    <dd>{formatPrice(check.deposit, { cents: true })}</dd>
                  </div>
                )}
                {hasQuote && <p className="pt-2 text-sm text-stone">Les pièces sur devis seront chiffrées séparément.</p>}
              </dl>
            )}
            <Link href="/commande" className="btn-primary mt-6 w-full">
              {quoteOnly ? 'Demander un devis' : 'Passer la commande'}
            </Link>
            <Link href="/catalogue" className="mt-3 block text-center text-sm font-semibold text-pine underline underline-offset-4">
              Continuer mes achats
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
