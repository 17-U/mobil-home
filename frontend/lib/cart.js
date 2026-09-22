'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

/** Panier stocké dans le navigateur. Les prix sont revérifiés par l'API au panier et au paiement. */
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      add(product, quantity = 1) {
        const items = [...get().items];
        const i = items.findIndex((it) => it.id === product.id);
        const max = product.maxQty || 1;
        if (i >= 0) {
          items[i] = { ...items[i], quantity: Math.min(items[i].quantity + quantity, max) };
        } else {
          items.push({
            id: product.id,
            slug: product.slug,
            reference: product.reference,
            title: product.title,
            image: product.image,
            price: product.price,
            priceFrom: product.priceFrom,
            condition: product.condition,
            maxQty: max,
            quantity: Math.min(quantity, max),
          });
        }
        set({ items });
      },
      setQuantity(id, quantity) {
        set({
          items: get().items.map((it) =>
            it.id === id ? { ...it, quantity: Math.max(1, Math.min(quantity, it.maxQty)) } : it
          ),
        });
      },
      remove(id) {
        set({ items: get().items.filter((it) => it.id !== id) });
      },
      /** Met à jour prix/stock depuis la réponse de /cart/check */
      sync(lines) {
        set({
          items: lines.map(({ product: p, quantity }) => ({
            id: p.id,
            slug: p.slug,
            reference: p.reference,
            title: p.title,
            image: p.image,
            price: p.price,
            priceFrom: p.priceFrom,
            condition: p.condition,
            maxQty: p.maxQty,
            quantity,
          })),
        });
      },
      clear() {
        set({ items: [] });
      },
    }),
    { name: 'mh-cart' }
  )
);

export function cartCount(items) {
  return items.reduce((n, it) => n + it.quantity, 0);
}

/** Évite les écarts d'hydratation : vrai seulement une fois monté côté client. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}
