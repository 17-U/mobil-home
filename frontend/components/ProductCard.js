import Image from 'next/image';
import Link from 'next/link';
import Footprint from './Footprint';
import { priceLabel, roomsLabel, locationLabel } from '@/lib/format';

export default function ProductCard({ product: p, priority = false }) {
  const meta = [p.year, roomsLabel(p)].filter(Boolean).join(', ');
  const place = p.condition === 'occasion' ? locationLabel(p.location) : p.condition === 'neuf' ? 'Neuf, garantie 10 ans' : null;

  return (
    <Link href={`/produit/${p.slug}`} className="group block focus-visible:outline-offset-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-mist">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${p.soldOut ? 'opacity-60 grayscale' : ''}`}
          />
        ) : null}
        {p.soldOut && (
          <span className="absolute left-3 top-3 rounded-sm bg-ink px-2 py-1 text-xs font-semibold text-white">
            Réservé
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[1.05rem] group-hover:text-pine">{p.title}</h3>
          {place && <p className="mt-1 text-sm text-stone">{place}</p>}
          {meta && <p className="text-sm text-stone">{meta}</p>}
        </div>
        <p className="shrink-0 text-right font-bold">
          {p.priceFrom && <span className="block text-xs font-normal text-stone">à partir de</span>}
          {p.priceFrom ? priceLabel({ ...p, priceFrom: false }) : priceLabel(p)}
        </p>
      </div>

      {p.lengthM && <Footprint length={p.lengthM} width={p.widthM} surface={p.surfaceM2} className="mt-3 max-w-[220px]" />}
    </Link>
  );
}
