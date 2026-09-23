'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi, clearToken, getToken } from '@/lib/admin';
import { SITE_NAME } from '@/lib/format';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', exact: true },
  { href: '/admin/produits', label: 'Produits' },
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/demandes', label: 'Demandes' },
];

export default function PanelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/connexion');
      return;
    }
    adminApi('/me').then((r) => setAdmin(r.admin)).catch(() => {});
  }, [router]);

  if (!admin) return <p className="p-10 text-stone">Vérification de la session…</p>;

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[240px_1fr]">
      <aside className="bg-pine text-white lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex items-center justify-between gap-4 p-5 lg:block">
          <Link href="/admin" className="display text-lg">{SITE_NAME}</Link>
          <p className="text-sm text-white/70 lg:mt-1">{admin.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Administration">
          {NAV.map((n) => {
            const on = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-md px-3 py-2.5 font-medium ${on ? 'bg-white text-pine' : 'hover:bg-white/10'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden space-y-1 px-3 pt-6 lg:block">
          <Link href="/" target="_blank" className="block rounded-md px-3 py-2 text-white/80 hover:bg-white/10">Voir la boutique</Link>
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace('/admin/connexion');
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-white/80 hover:bg-white/10"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
