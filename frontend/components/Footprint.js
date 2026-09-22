import { formatMeters, formatSurface } from '@/lib/format';

// Tous les plans partagent la même échelle : 13 m = toute la largeur.
// Deux mobil-homes côte à côte se comparent donc d'un coup d'œil.
const SCALE_M = 13;
const W = 260;

export default function Footprint({ length, width, surface, size = 'sm', className = '' }) {
  if (!length || !width) return null;
  const u = W / SCALE_M;
  const l = length * u;
  const w = width * u;
  const big = size === 'lg';
  const pad = 2;
  const h = w + (big ? 26 : 2) + pad * 2;

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W + pad * 2} ${h}`}
        className="block w-full"
        role="img"
        aria-label={`Plan au sol : ${formatMeters(length)} m sur ${formatMeters(width)} m`}
      >
        {/* graduation d'un mètre sur toute l'échelle */}
        {big &&
          Array.from({ length: SCALE_M + 1 }, (_, i) => (
            <line
              key={i}
              x1={pad + i * u}
              x2={pad + i * u}
              y1={pad + w + 8}
              y2={pad + w + (i % 5 === 0 ? 16 : 12)}
              className="stroke-stone/50"
              strokeWidth="1"
            />
          ))}
        <rect
          x={pad}
          y={pad}
          width={l}
          height={w}
          rx="1.5"
          className="fill-mist stroke-pine"
          strokeWidth={big ? 2 : 1.5}
        />
        {big && (
          <>
            <text x={pad} y={h - 1} className="fill-stone text-[9px]">
              0
            </text>
            <text x={pad + 5 * u} y={h - 1} className="fill-stone text-[9px]" textAnchor="middle">
              5 m
            </text>
            <text x={pad + 10 * u} y={h - 1} className="fill-stone text-[9px]" textAnchor="middle">
              10 m
            </text>
          </>
        )}
      </svg>
      <figcaption className={`mt-1.5 text-stone ${big ? 'text-sm' : 'text-xs'}`}>
        {formatMeters(length)} × {formatMeters(width)} m
        {surface ? `, ${formatSurface(surface)}` : ''}
      </figcaption>
    </figure>
  );
}
