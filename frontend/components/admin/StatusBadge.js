import { ORDER_STATUS_LABELS } from '@/lib/format';

const TONES = {
  nouvelle: 'bg-sun text-ink',
  devis_envoye: 'bg-sun-soft text-ink',
  acompte_recu: 'bg-[#d8eadf] text-pine',
  confirmee: 'bg-[#d8eadf] text-pine',
  livraison: 'bg-pine text-white',
  terminee: 'bg-mist text-stone',
  annulee: 'bg-[#f6dcda] text-danger',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-sm font-semibold ${TONES[status] || 'bg-mist'}`}>
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}
