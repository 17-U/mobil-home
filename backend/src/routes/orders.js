const express = require('express');
const { z } = require('zod');
const config = require('../config');
const db = require('../db');
const { createOrder, getOrderFull, markDepositPaid } = require('../lib/orders');

const router = express.Router();
const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

const orderSchema = z.object({
  items: z
    .array(z.object({ productId: z.coerce.number().int().positive(), quantity: z.coerce.number().int().min(1) }))
    .min(1, 'Votre panier est vide.')
    .max(50),
  customer: z.object({
    firstName: z.string().trim().min(1, 'Prénom requis').max(80),
    lastName: z.string().trim().min(1, 'Nom requis').max(80),
    email: z.email('Adresse e-mail invalide').max(160),
    phone: z.string().trim().min(6, 'Téléphone requis').max(30),
    address: z.string().trim().max(200).optional().default(''),
    postalCode: z.string().trim().max(12).optional().default(''),
    city: z.string().trim().max(100).optional().default(''),
    country: z.string().trim().max(60).optional().default('France'),
  }),
  deliveryZone: z.enum(['moins_100', 'plus_100', 'retrait', 'inconnu']).default('inconnu'),
  paymentMethod: z.enum(['virement', 'carte', 'rendez_vous']).default('virement'),
  notes: z.string().trim().max(2000).optional(),
  acceptTerms: z.literal(true, { error: 'Vous devez accepter les conditions de vente.' }),
});

router.post('/', async (req, res) => {
  const input = orderSchema.parse(req.body);
  const order = createOrder(input);

  let paymentUrl = null;
  if (order.paymentMethod === 'carte' && stripe && order.depositAmount > 0) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customer.email,
      locale: 'fr',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(order.depositAmount * 100),
            product_data: {
              name: `Acompte commande ${order.number}`,
              description: order.items.map((i) => `${i.title} (${i.reference})`).join(', ').slice(0, 480),
            },
          },
        },
      ],
      metadata: { orderId: String(order.id), orderNumber: order.number },
      success_url: `${config.frontendUrl}/commande/confirmation/${order.number}?email=${encodeURIComponent(order.customer.email)}&paiement=ok`,
      cancel_url: `${config.frontendUrl}/commande/confirmation/${order.number}?email=${encodeURIComponent(order.customer.email)}&paiement=annule`,
    });
    db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(session.id, order.id);
    paymentUrl = session.url;
  }

  res.status(201).json({ order: publicOrder(order), paymentUrl });
});

// Suivi de commande : numéro + e-mail
router.get('/track', (req, res) => {
  const number = String(req.query.number || '').trim().toUpperCase();
  const email = String(req.query.email || '').trim().toLowerCase();
  const row = db.prepare('SELECT id, email FROM orders WHERE number = ?').get(number);
  if (!row || row.email.toLowerCase() !== email) {
    return res.status(404).json({ error: 'Aucune commande ne correspond à ce numéro et cet e-mail.' });
  }
  res.json({ order: publicOrder(getOrderFull(row.id)) });
});

function publicOrder(o) {
  // pas d'identifiants internes Stripe côté client
  const { id, ...rest } = o;
  return rest;
}

// Webhook Stripe (monté avec express.raw dans server.js)
async function stripeWebhook(req, res) {
  if (!stripe) return res.status(404).end();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).send(`Signature invalide : ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.payment_status === 'paid' && s.metadata?.orderId) {
      markDepositPaid(Number(s.metadata.orderId), s.amount_total / 100, s.id);
    }
  }
  res.json({ received: true });
}

module.exports = { router, stripeWebhook };
