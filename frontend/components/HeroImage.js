'use client';

import Image from 'next/image';
import { useState } from 'react';

// Certaines photos de produits viennent de sites tiers et sont parfois cassées : on essaie les
// candidats les uns après les autres jusqu'à en trouver une qui charge, sans afficher d'icône cassée.
export default function HeroImage({ srcs = [], ...props }) {
  const [index, setIndex] = useState(0);
  const src = srcs[index];
  if (!src) return null;
  return <Image key={src} src={src} onError={() => setIndex((i) => i + 1)} {...props} />;
}
