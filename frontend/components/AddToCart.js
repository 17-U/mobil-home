'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart, useHydrated } from '@/lib/cart';

export default function AddToCart({ product }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.find((i) => i.id === product.id));
  const hydrated = useHydrated();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.soldOut) {
    return (
      <div className="rounded-md bg-mist p-4">
        <p className="font-semibold">Ce mobil-home est réservé.</p>
        <p className="mt-1 text-sm text-stone">Parcourez les modèles similaires plus bas ou appelez-nous pour être prévenu s’il se libère.</p>
      </div>
    );
  }

  const quote = product.onQuote;
  const canPickQty = product.maxQty > 1;
  const reachedMax = hydrated && inCart && inCart.quantity >= product.maxQty;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {canPickQty && (
          <div>
            <label htmlFor="qty" className="label">Quantité</label>
            <input
              id="qty"
              type="number"
              min={1}
              max={product.maxQty}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(product.maxQty, Number(e.target.value) || 1)))}
              className="field w-24"
            />
          </div>
        )}
        <button
          type="button"
          className="btn-primary flex-1 sm:flex-none"
          disabled={reachedMax}
          onClick={() => {
            add(product, qty);
            setAdded(true);
          }}
        >
          {quote ? 'Ajouter à ma demande de devis' : 'Ajouter au panier'}
        </button>
      </div>
      {(added || (hydrated && inCart)) && (
        <p className="text-sm" role="status">
          {added ? 'Ajouté. ' : 'Déjà dans votre panier. '}
          <Link href="/panier" className="font-semibold text-pine underline underline-offset-4">
            Voir le panier
          </Link>
        </p>
      )}
    </div>
  );
}
