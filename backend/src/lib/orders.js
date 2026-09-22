const db = require('../db');
const config = require('../config');
const { orderOut } = require('./serialize');
const { orderNumber } = require('./utils');
const { MAX_QTY } = require('./constants');

class OrderError extends Error {
  constructor(message, details) {
    super(message);
    this.status = 400;
    this.details = details;
  }
}

/**
 * Vérifie le panier côté serveur : prix, disponibilité et quantités
 * viennent toujours de la base, jamais du navigateur.
 */
function checkCart(items) {
  const lines = [];
  const problems = [];
  const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND is_published = 1');

  for (const { productId, quantity } of items) {
    const p = getProduct.get(productId);
    if (!p) {
      problems.push({ productId, message: 'Ce produit n’est plus disponible.' });
      continue;
    }
    const max = p.stock === null ? MAX_QTY[p.condition] || 1 : p.stock;
    if (max <= 0) {
      problems.push({ productId, message: `${p.title} (${p.reference}) vient d’être réservé.` });
      continue;
    }
    const qty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), max);
    lines.push({ product: p, quantity: qty });
  }

  const subtotal = lines.reduce((s, l) => s + (l.product.price ?? 0) * l.quantity, 0);
  const hasQuoteItems = lines.some((l) => l.product.price === null);
  const hasPricedItems = lines.some((l) => l.product.price !== null);
  const deposit = Math.round(subtotal * config.depositRate * 100) / 100;

  return { lines, problems, subtotal, deposit, hasQuoteItems, hasPricedItems };
}

function getOrderFull(id) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return null;
  const items = db
    .prepare(
      `SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ? ORDER BY oi.id`
    )
    .all(id);
  const events = db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id').all(id);
  return orderOut(row, items, events);
}

const createOrderTx = db.transaction((input) => {
  const cart = checkCart(input.items);
  if (cart.problems.length) throw new OrderError('Votre panier a changé.', cart.problems);
  if (!cart.lines.length) throw new OrderError('Votre panier est vide.');

  const type = cart.hasPricedItems ? 'commande' : 'devis';
  const paymentMethod = type === 'devis' ? 'aucun' : input.paymentMethod;
  if (paymentMethod === 'carte' && !config.stripe.secretKey) {
    throw new OrderError('Le paiement par carte n’est pas activé.');
  }

  const number = orderNumber();
  const c = input.customer;
  const info = db
    .prepare(
      `INSERT INTO orders (number, type, first_name, last_name, email, phone, address, postal_code, city, country,
        delivery_zone, notes, payment_method, subtotal, deposit_amount, has_quote_items)
       VALUES (@number, @type, @firstName, @lastName, @email, @phone, @address, @postalCode, @city, @country,
        @deliveryZone, @notes, @paymentMethod, @subtotal, @deposit, @hasQuoteItems)`
    )
    .run({
      number,
      type,
      ...c,
      deliveryZone: input.deliveryZone,
      notes: input.notes || null,
      paymentMethod,
      subtotal: cart.subtotal,
      deposit: type === 'devis' ? 0 : cart.deposit,
      hasQuoteItems: cart.hasQuoteItems ? 1 : 0,
    });
  const orderId = info.lastInsertRowid;

  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, reference, title, image, unit_price, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const decrement = db.prepare(
    "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ? AND stock IS NOT NULL"
  );
  for (const { product: p, quantity } of cart.lines) {
    const image = JSON.parse(p.images || '[]')[0] || null;
    insertItem.run(orderId, p.id, p.reference, p.title, image, p.price, quantity);
    decrement.run(quantity, p.id);
  }

  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(
    orderId,
    'nouvelle',
    type === 'devis' ? 'Demande de devis reçue' : 'Commande reçue'
  );

  return orderId;
});

function createOrder(input) {
  const id = createOrderTx(input);
  return getOrderFull(id);
}

const restock = db.prepare(
  "UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ? AND stock IS NOT NULL"
);

const updateStatusTx = db.transaction((id, status, note) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  if (order.status === status && !note) return order;

  // Annulation : les mobil-homes d'occasion redeviennent disponibles
  if (status === 'annulee' && order.status !== 'annulee') {
    for (const i of db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)) {
      if (i.product_id) restock.run(i.quantity, i.product_id);
    }
  }
  if (order.status === 'annulee' && status !== 'annulee') {
    for (const i of db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)) {
      if (i.product_id) restock.run(-i.quantity, i.product_id);
    }
  }
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(id, status, note || null);
  return order;
});

function markDepositPaid(orderId, amount, sessionId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order || order.paid_amount >= amount) return;
  db.prepare(
    "UPDATE orders SET paid_amount = ?, stripe_session_id = COALESCE(?, stripe_session_id), updated_at = datetime('now') WHERE id = ?"
  ).run(amount, sessionId, orderId);
  if (order.status === 'nouvelle') updateStatusTx(orderId, 'acompte_recu', 'Acompte payé par carte');
}

module.exports = { checkCart, createOrder, getOrderFull, updateStatusTx, markDepositPaid, OrderError };
