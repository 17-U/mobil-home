const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const config = require('../config');
const db = require('../db');
const products = require('../lib/products');
const { checkCart } = require('../lib/orders');
const { productOut } = require('../lib/serialize');
const { DELIVERY_ZONES } = require('../lib/constants');

const router = express.Router();

router.get('/settings', (req, res) => {
  res.json({
    shop: config.shop,
    depositRate: config.depositRate,
    stripeEnabled: !!config.stripe.secretKey,
    bank: config.bank,
    deliveryZones: DELIVERY_ZONES,
  });
});

router.get('/categories', (req, res) => {
  res.json(products.listCategories());
});

router.get('/products', (req, res) => {
  const q = req.query;
  res.json(
    products.searchProducts({
      category: q.category,
      brand: q.brand,
      location: q.location,
      bedrooms: q.bedrooms,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      q: q.q,
      sort: q.sort,
      page: q.page,
      limit: q.limit,
      featured: q.featured === '1',
      available: q.available === '1',
    })
  );
});

router.get('/products/facets', (req, res) => {
  res.json(products.facets(req.query.category));
});

router.get('/products/:slug', (req, res) => {
  const product = products.getBySlug(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json({ product, related: products.related(product) });
});

const cartSchema = z.object({
  items: z
    .array(z.object({ productId: z.coerce.number().int().positive(), quantity: z.coerce.number().int().min(1) }))
    .max(50),
});

// Le panier appelle cette route pour rafraîchir prix et disponibilités
router.post('/cart/check', (req, res) => {
  const { items } = cartSchema.parse(req.body);
  const cart = checkCart(items);
  res.json({
    lines: cart.lines.map((l) => ({ product: productOut(l.product), quantity: l.quantity })),
    problems: cart.problems,
    subtotal: cart.subtotal,
    deposit: cart.deposit,
    hasQuoteItems: cart.hasQuoteItems,
    hasPricedItems: cart.hasPricedItems,
  });
});

const contactSchema = z
  .object({
    name: z.string().trim().min(1, 'Nom requis').max(120),
    phone: z.string().trim().max(30).optional().default(''),
    email: z.string().trim().max(160).optional().default(''),
    message: z.string().trim().max(2000).optional().default(''),
  })
  .refine((d) => d.phone || d.email, { message: 'Indiquez un téléphone ou un e-mail.', path: ['phone'] });

const contactLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/contact', contactLimiter, (req, res) => {
  const d = contactSchema.parse(req.body);
  db.prepare('INSERT INTO leads (name, phone, email, message) VALUES (@name, @phone, @email, @message)').run(d);
  res.status(201).json({ ok: true });
});

module.exports = router;
