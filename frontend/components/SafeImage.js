'use client';

import Image from 'next/image';
import { useState } from 'react';

// Certaines photos viennent de sites tiers et sont parfois cassées : on masque l'image plutôt que
// de laisser l'icône « image cassée » du navigateur, le fond de la section reste visible derrière.
export default function SafeImage({ src, ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <Image src={src} onError={() => setFailed(true)} {...props} />;
}
