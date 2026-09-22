'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

// Déduit la pièce montrée à partir du nom de fichier ("Cuisine-DELTA-...png" -> "Cuisine")
function roomName(url) {
  const file = decodeURIComponent(url.split('/').pop() || '').replace(/\.[a-z]+$/i, '');
  const first = file.split(/[-_]/)[0];
  const map = { Devanture: 'Façade', Sejour: 'Séjour', Salle: 'Salle d’eau', Chambre: 'Chambre', Vue: 'Vue' };
  const clean = first.replace(/\d+$/, '');
  return map[clean] || (clean.length > 2 && clean.length < 16 ? clean : '');
}

export default function Gallery({ images = [], title }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = images.length;
  const go = useCallback((d) => setIndex((i) => (i + d + n) % n), [n]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoom, go]);

  if (!n) return <div className="aspect-[4/3] rounded-md bg-mist" />;
  const current = images[index];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-mist">
        <button type="button" className="absolute inset-0 cursor-zoom-in" onClick={() => setZoom(true)} aria-label="Agrandir la photo">
          <Image src={current} alt={`${title}, photo ${index + 1}`} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
        </button>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-3 py-2 font-bold shadow-sm" aria-label="Photo précédente">
              ‹
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-3 py-2 font-bold shadow-sm" aria-label="Photo suivante">
              ›
            </button>
            <p className="absolute bottom-3 left-3 rounded-sm bg-ink/80 px-2 py-1 text-xs text-white">
              {roomName(current) || 'Photo'} ({index + 1}/{n})
            </p>
          </>
        )}
      </div>

      {n > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`relative block aspect-square w-full overflow-hidden rounded-sm ${i === index ? 'ring-2 ring-pine ring-offset-2' : 'opacity-75 hover:opacity-100'}`}
                aria-label={`Voir la photo ${i + 1}${roomName(src) ? ` (${roomName(src)})` : ''}`}
                aria-current={i === index}
              >
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4" role="dialog" aria-modal="true" aria-label="Photos en grand">
          <button type="button" onClick={() => setZoom(false)} className="absolute right-4 top-4 rounded-md bg-white px-3 py-1.5 font-semibold">
            Fermer
          </button>
          <div className="relative h-[80vh] w-full max-w-6xl">
            <Image src={current} alt={`${title}, photo ${index + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          {n > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute left-4 top-1/2 rounded-md bg-white px-4 py-3 text-xl font-bold" aria-label="Photo précédente">‹</button>
              <button type="button" onClick={() => go(1)} className="absolute right-4 top-1/2 rounded-md bg-white px-4 py-3 text-xl font-bold" aria-label="Photo suivante">›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
