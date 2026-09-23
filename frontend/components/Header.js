'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart, cartCount, useHydrated } from '@/lib/cart';
import { SITE_NAME } from '@/lib/format';

const NAV = [
  {
    label: 'Mobil-homes',
    match: '/categorie/mobil-homes',
    items: [
      { href: '/categorie/mobil-homes-neufs', label: 'Mobil-homes neufs' },
      { href: '/categorie/mobil-homes-occasion', label: 'Mobil-homes d’occasion' },
    ],
  },
  { href: '/categorie/pieces-detachees', label: 'Pièces détachées' },
  { href: '/suivi', label: 'Suivre une commande' },
];

export default function Header({ phone }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between gap-6">
        <Link href="/" className="display whitespace-nowrap text-lg text-pine sm:text-xl">
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {NAV.map((n) =>
            n.items ? (
              <div
                key={n.label}
                className="group relative"
                onMouseEnter={() => setMenuOpen(n.label)}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 text-[0.95rem] font-semibold text-ink hover:text-sun ${pathname.startsWith(n.match) ? 'text-sun' : ''}`}
                  aria-expanded={menuOpen === n.label}
                  onClick={() => setMenuOpen((m) => (m === n.label ? false : n.label))}
                >
                  {n.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {menuOpen === n.label && (
                  <ul className="absolute left-0 top-full min-w-[220px] rounded-md border border-line bg-white py-2 shadow-lg">
                    {n.items.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className="block px-4 py-2.5 text-ink hover:bg-mist hover:text-sun">
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                className={`text-[0.95rem] font-semibold text-ink hover:text-sun ${pathname.startsWith(n.href) ? 'text-sun' : ''}`}
              >
                {n.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="hidden items-center gap-2 rounded-full bg-pine px-4 py-2.5 font-semibold text-white transition-colors hover:bg-pine-dark lg:inline-flex"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {phone}
            </a>
          )}
          <Link
            href="/panier"
            className="inline-flex items-center gap-2 rounded-full bg-mist px-4 py-2.5 font-semibold text-ink transition-colors hover:bg-sun hover:text-white"
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
            className="rounded-full bg-mist px-3 py-2.5 font-semibold text-ink md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" className="border-t border-line bg-white md:hidden" aria-label="Navigation mobile">
          <ul className="container-page py-2">
            {NAV.flatMap((n) => (n.items ? n.items : [n])).map((n) => (
              <li key={n.href} className="border-b border-line last:border-0">
                <Link href={n.href} className="block py-3.5 text-lg font-medium text-ink hover:text-sun">
                  {n.label}
                </Link>
              </li>
            ))}
            {phone && (
              <li className="py-3.5">
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-semibold text-pine">{phone}</a>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
