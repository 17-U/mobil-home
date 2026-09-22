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
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="display whitespace-nowrap text-base text-pine sm:text-xl">
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[0.95rem] font-medium hover:text-pine ${pathname.startsWith(n.href) ? 'text-pine underline decoration-sun decoration-2 underline-offset-8' : ''}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/panier" className="btn-ghost px-4 py-2" aria-label={`Panier, ${count} article(s)`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            <span className="hidden sm:inline">Panier</span>
            {count > 0 && (
              <span className="rounded-sm bg-sun px-1.5 text-sm font-bold leading-6 text-ink">{count}</span>
            )}
          </Link>
          <button
            type="button"
            className="btn-ghost px-3 py-2 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" className="border-t border-line md:hidden" aria-label="Navigation mobile">
          <ul className="container-page py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block py-3 text-lg font-medium">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
