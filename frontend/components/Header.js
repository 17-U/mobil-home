'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart, cartCount, useHydrated } from '@/lib/cart';
import { SITE_NAME } from '@/lib/format';

const NAV = [
  { href: '/categorie/mobil-homes-neufs', label: 'Neufs' },
  { href: '/categorie/mobil-homes-occasion', label: 'Occasion' },
  { href: '/categorie/pieces-detachees', label: 'Pièces détachées' },
  { href: '/suivi', label: 'Suivre une commande' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-4 z-40 px-4">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-6 rounded-full bg-pine/95 px-6 text-white shadow-lg shadow-black/10 backdrop-blur">
          <Link href="/" className="display whitespace-nowrap text-base text-white sm:text-xl">
            {SITE_NAME}
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-[0.95rem] font-medium text-white/85 hover:text-sun ${pathname.startsWith(n.href) ? 'text-sun' : ''}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/panier"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-sun hover:text-white"
              aria-label={`Panier, ${count} article(s)`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
                <circle cx="10" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
              </svg>
              <span className="hidden sm:inline">Panier</span>
              {count > 0 && (
                <span className="rounded-full bg-sun px-1.5 text-sm font-bold leading-6 text-white">{count}</span>
              )}
            </Link>
            <button
              type="button"
              className="rounded-full bg-white/10 px-3 py-2.5 font-semibold text-white md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="menu-mobile"
            >
              Menu
            </button>
          </div>
        </div>

        {open && (
          <nav id="menu-mobile" className="mt-2 rounded-3xl bg-pine text-white md:hidden" aria-label="Navigation mobile">
            <ul className="px-6 py-2">
              {NAV.map((n) => (
                <li key={n.href} className="border-b border-white/10 last:border-0">
                  <Link href={n.href} className="block py-3.5 text-lg font-medium hover:text-sun">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
