const ORDER_STATUSES = {
  nouvelle: 'Reçue',
  devis_envoye: 'Devis envoyé',
  acompte_recu: 'Acompte reçu',
  confirmee: 'Confirmée',
  livraison: 'Livraison planifiée',
  terminee: 'Installée',
  annulee: 'Annulée',
};

const PAYMENT_METHODS = {
  virement: 'Acompte par virement',
  carte: 'Acompte par carte',
  rendez_vous: 'Règlement lors d’un rendez-vous',
  aucun: 'Aucun (demande de devis)',
};

const DELIVERY_ZONES = {
  moins_100: 'À moins de 100 km',
  plus_100: 'À plus de 100 km (transport sur devis)',
  retrait: 'Mobil-home laissé sur son emplacement actuel',
  inconnu: 'À préciser',
};

// Quantité maximale commandable par type de produit
const MAX_QTY = { neuf: 10, occasion: 1, piece: 50 };

module.exports = { ORDER_STATUSES, PAYMENT_METHODS, DELIVERY_ZONES, MAX_QTY };
