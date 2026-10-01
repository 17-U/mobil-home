'use client';

import { useEffect, useRef, useState } from 'react';

// Fait apparaître un bloc (fondu + glissement) quand il entre dans l'écran.
// direction: 'top' (par défaut, descend du haut), 'left' (arrive de la gauche), 'right' (arrive de la droite).
const HIDDEN_BY_DIRECTION = {
  top: '-translate-y-10 opacity-0',
  left: '-translate-x-16 opacity-0',
  right: 'translate-x-16 opacity-0',
};

export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div', direction = 'top' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = HIDDEN_BY_DIRECTION[direction] || HIDDEN_BY_DIRECTION.top;

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-x-0 translate-y-0 opacity-100' : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
