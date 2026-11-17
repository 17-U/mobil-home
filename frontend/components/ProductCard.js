'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from './SafeImage';
import { priceLabel, formatSurface } from '@/lib/format';

const FAVORITES_KEY = 'mh-favorites';

function useFavorite(id) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      setIsFavorite(stored.includes(id));
    } catch {
      // localStorage indisponible (navigation privée...) : on reste sur l'état par défaut.
    }
  }, [id]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      const next = stored.includes(id) ? stored.filter((v) => v !== id) : [...stored, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setIsFavorite(next.includes(id));
    } catch {
      setIsFavorite((v) => !v);
    }
  };

  return [isFavorite, toggle];
}

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4c2-.3 4 .6 5 2.3h.8c1-1.7 3-2.6 5-2.3 3.3.5 5.1 3.8 3.6 7.2-2.5 4.7-10 9.3-10 9.3Z" />
    </svg>
  );
}
function BedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 17v4M2 10v7h20v-7M2 10V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v4M13 10V8a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3v3M22 17v4" />
    </svg>
  );
}
function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
function ResizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

export default function ProductCard({ product: p, priority = false }) {
  const [isFavorite, toggleFavorite] = useFavorite(p.id);

  const badge = p.soldOut ? 'Réservé' : p.condition === 'neuf' ? 'À l’usine' : p.condition === 'occasion' ? 'En stock' : null;
  const specs = [
    p.bedrooms ? { Icon: BedIcon, label: p.bedrooms } : null,
    p.year ? { Icon: HouseIcon, label: p.year } : null,
    p.surfaceM2 ? { Icon: ResizeIcon, label: formatSurface(p.surfaceM2) } : null,
  ].filter(Boolean);
  const ctaLabel =
    p.condition === 'neuf' ? 'Voir la fiche du Mobil-Home Neuf' : p.condition === 'occasion' ? 'Voir la fiche du Mobil-Home Occasion' : 'Voir la fiche';

  return (
    <Link href={`/produit/${p.slug}`} className="group block overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-line/60 transition-shadow hover:shadow-xl focus-visible:outline-offset-4">
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        {p.image ? (
          <SafeImage
            src={p.image}
            alt={p.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${p.soldOut ? 'opacity-60 grayscale' : ''}`}
          />
        ) : null}

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-white text-sun shadow-md transition-transform hover:scale-110"
        >
          <HeartIcon filled={isFavorite} />
        </button>

        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-sun px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
            {badge}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="truncate text-lg font-bold text-sun underline decoration-2 underline-offset-4">{p.title}</h3>

        <p className="mt-3 font-bold text-ink">
          {p.priceFrom && <span className="mr-1 block text-xs font-normal text-stone">à partir de</span>}
          {p.priceFrom ? priceLabel({ ...p, priceFrom: false }) : priceLabel(p)}
        </p>

        {specs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone">
            {specs.map(({ Icon, label }, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Icon />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="bg-ink py-3.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-pine-dark">
        {ctaLabel}
      </p>
    </Link>
  );
}
