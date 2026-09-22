const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurCents = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function formatPrice(value, { cents = false } = {}) {
  if (value === null || value === undefined) return '';
  return (cents || value % 1 !== 0 ? eurCents : eur).format(value);
}

export function priceLabel(p) {
  if (p.onQuote || p.price === null) return 'Sur devis';
  return p.priceFrom ? `À partir de ${formatPrice(p.price)}` : formatPrice(p.price);
}

export function formatMeters(n) {
  if (!n && n !== 0) return '';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatSurface(n) {
  if (!n) return '';
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m²`;
}

export function locationLabel(loc) {
  if (!loc) return null;
  if (loc === 'notre parc') return 'Sur notre parc';
  if (loc === 'à sortir') return 'À sortir du camping';
  return `Camping ${loc}`;
}

export function formatDate(iso, withTime = false) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function roomsLabel(p) {
  const parts = [];
  if (p.bedrooms) parts.push(`${p.bedrooms} chambre${p.bedrooms > 1 ? 's' : ''}`);
  if (p.sleeps) parts.push(`${p.sleeps} couchages`);
  return parts.join(', ');
}

export const ORDER_STATUS_LABELS = {
  nouvelle: 'Reçue',
  devis_envoye: 'Devis envoyé',
  acompte_recu: 'Acompte reçu',
  confirmee: 'Confirmée',
  livraison: 'Livraison planifiée',
  terminee: 'Installée',
  annulee: 'Annulée',
};

export const PAYMENT_LABELS = {
  virement: 'Acompte par virement',
  carte: 'Acompte par carte',
  rendez_vous: 'Règlement lors d’un rendez-vous',
  aucun: 'Demande de devis',
};

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Mobil-Home Store';
