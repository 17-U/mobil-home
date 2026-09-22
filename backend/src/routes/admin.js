const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const config = require('../config');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { searchProducts, getById } = require('../lib/products');
const { getOrderFull, updateStatusTx } = require('../lib/orders');
const { slugify } = require('../lib/utils');
const { ORDER_STATUSES } = require('../lib/constants');

const router = express.Router();

/* ---------- Authentification ---------- */

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = z
    .object({ email: z.string().trim().toLowerCase(), password: z.string().min(1) })
    .parse(req.body);
  const admin = db.prepare('SELECT * FROM admins WHERE lower(email) = ?').get(email);
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' });
  }
  const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name }, config.jwtSecret, {
    expiresIn: '12h',
  });
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

router.use(requireAdmin);

router.get('/me', (req, res) => res.json({ admin: req.admin }));

/* ---------- Tableau de bord ---------- */

router.get('/stats', (req, res) => {
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  const activeOrders = "status NOT IN ('annulee')";
  res.json({
    products: one(`SELECT
        COUNT(*) AS total,
        SUM(is_published) AS published,
        SUM(CASE WHEN stock IS NOT NULL AND stock <= 0 THEN 1 ELSE 0 END) AS reserved
      FROM products`),
    orders: one(`SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'nouvelle' THEN 1 ELSE 0 END) AS toProcess,
        SUM(CASE WHEN type = 'devis' THEN 1 ELSE 0 END) AS quotes,
        COALESCE(SUM(CASE WHEN ${activeOrders} THEN subtotal END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN ${activeOrders} THEN paid_amount END), 0) AS paid
      FROM orders`),
    byStatus: db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all(),
    byCategory: db
      .prepare(
        `SELECT c.name, COUNT(p.id) AS count FROM categories c
         LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.sort`
      )
      .all(),
    last30Days: db
      .prepare(
        `SELECT date(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(subtotal), 0) AS amount
         FROM orders WHERE created_at >= datetime('now', '-30 days') AND ${activeOrders}
         GROUP BY day ORDER BY day`
      )
      .all(),
    recentOrders: db
      .prepare(
        `SELECT id, number, type, status, first_name, last_name, subtotal, created_at
         FROM orders ORDER BY id DESC LIMIT 6`
      )
      .all()
      .map((o) => ({
        id: o.id,
        number: o.number,
        type: o.type,
        status: o.status,
        customer: `${o.first_name} ${o.last_name}`,
        subtotal: o.subtotal,
        createdAt: o.created_at,
      })),
    statuses: ORDER_STATUSES,
  });
});

router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort').all());
});

/* ---------- Produits ---------- */

router.get('/products', (req, res) => {
  const q = req.query;
  res.json(
    searchProducts({
      category: q.category,
      q: q.q,
      sort: q.sort || 'recent',
      page: q.page,
      limit: q.limit || 25,
      includeUnpublished: true,
    })
  );
});

router.get('/products/:id', (req, res) => {
  const product = getById(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json(product);
});

const nullableNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().nonnegative().nullable()
);
const nullableInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().int().nullable()
);
const nullableText = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.string().trim().nullable());

const productSchema = z.object({
  reference: z.string().trim().min(1, 'Référence requise').max(40),
  slug: z.string().trim().max(90).optional(),
  categoryId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, 'Titre requis').max(150),
  brand: nullableText,
  model: nullableText,
  year: nullableInt,
  condition: z.enum(['neuf', 'occasion', 'piece']),
  origin: nullableText,
  statusLabel: nullableText,
  location: nullableText,
  availability: nullableText,
  price: nullableNumber,
  priceFrom: z.coerce.boolean().default(false),
  lengthM: nullableNumber,
  widthM: nullableNumber,
  surfaceM2: nullableNumber,
  bedrooms: nullableInt,
  sleeps: nullableInt,
  bathrooms: nullableInt,
  kitchen: nullableText,
  features: z.array(z.string().trim().min(1)).default([]),
  priceConditions: nullableText,
  description: nullableText,
  images: z.array(z.string().trim().min(1)).default([]),
  stock: nullableInt,
  isPublished: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

function toRow(d) {
  const surface = d.surfaceM2 ?? (d.lengthM && d.widthM ? Math.round(d.lengthM * d.widthM * 100) / 100 : null);
  return {
    reference: d.reference,
    slug: slugify(d.slug || `${d.title}-${d.reference}`),
    category_id: d.categoryId,
    title: d.title,
    brand: d.brand,
    model: d.model,
    year: d.year,
    condition: d.condition,
    origin: d.origin,
    status_label: d.statusLabel,
    location: d.location,
    availability: d.availability,
    price: d.price,
    price_from: d.priceFrom ? 1 : 0,
    length_m: d.lengthM,
    width_m: d.widthM,
    surface_m2: surface,
    bedrooms: d.bedrooms,
    sleeps: d.sleeps,
    bathrooms: d.bathrooms,
    kitchen: d.kitchen,
    features: JSON.stringify(d.features),
    price_conditions: d.priceConditions,
    description: d.description,
    images: JSON.stringify(d.images),
    stock: d.stock,
    is_published: d.isPublished ? 1 : 0,
    is_featured: d.isFeatured ? 1 : 0,
  };
}

const COLUMNS = Object.keys(toRow(productSchema.parse({
  reference: 'x', categoryId: 1, title: 'x', condition: 'neuf',
})));

router.post('/products', (req, res) => {
  const row = toRow(productSchema.parse(req.body));
  const info = db
    .prepare(`INSERT INTO products (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map((c) => '@' + c).join(', ')})`)
    .run(row);
  res.status(201).json(getById(info.lastInsertRowid));
});

router.put('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!getById(id)) return res.status(404).json({ error: 'Produit introuvable.' });
  const row = toRow(productSchema.parse(req.body));
  db.prepare(
    `UPDATE products SET ${COLUMNS.map((c) => `${c} = @${c}`).join(', ')}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...row, id });
  res.json(getById(id));
});

// Modification rapide (publication, mise en avant, stock)
router.patch('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const d = z
    .object({ isPublished: z.boolean().optional(), isFeatured: z.boolean().optional(), stock: nullableInt.optional() })
    .parse(req.body);
  const sets = [];
  const params = { id };
  if (d.isPublished !== undefined) (sets.push('is_published = @p'), (params.p = d.isPublished ? 1 : 0));
  if (d.isFeatured !== undefined) (sets.push('is_featured = @f'), (params.f = d.isFeatured ? 1 : 0));
  if (d.stock !== undefined) (sets.push('stock = @s'), (params.s = d.stock));
  if (sets.length) db.prepare(`UPDATE products SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(params);
  const product = getById(id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json(product);
});

router.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const inOrders = db.prepare('SELECT COUNT(*) AS n FROM order_items WHERE product_id = ?').get(id).n;
  if (inOrders) {
    // On garde l'historique des commandes : le produit est seulement dépublié
    db.prepare("UPDATE products SET is_published = 0, updated_at = datetime('now') WHERE id = ?").run(id);
    return res.json({ archived: true });
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ deleted: true });
});

/* ---------- Upload d'images ---------- */

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|avif|gif)$/.test(file.mimetype);
    cb(ok ? null : Object.assign(new Error('Formats acceptés : JPG, PNG, WebP, AVIF, GIF.'), { status: 400 }), ok);
  },
});

router.post('/uploads', upload.array('images', 20), (req, res) => {
  res.status(201).json({ urls: (req.files || []).map((f) => `${config.publicUrl}/uploads/${f.filename}`) });
});

/* ---------- Commandes ---------- */

router.get('/orders', (req, res) => {
  const { status, type, q } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 25;
  const where = [];
  const params = {};
  if (status) (where.push('status = @status'), (params.status = status));
  if (type) (where.push('type = @type'), (params.type = type));
  if (q) {
    where.push('(number LIKE @q OR email LIKE @q OR last_name LIKE @q OR first_name LIKE @q OR phone LIKE @q)');
    params.q = `%${q}%`;
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM orders ${w}`).get(params).n;
  const rows = db
    .prepare(
      `SELECT o.*, (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count
       FROM orders o ${w} ORDER BY o.id DESC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset: (page - 1) * limit });
  res.json({
    items: rows.map((o) => ({
      id: o.id,
      number: o.number,
      type: o.type,
      status: o.status,
      customer: `${o.first_name} ${o.last_name}`,
      email: o.email,
      phone: o.phone,
      subtotal: o.subtotal,
      depositAmount: o.deposit_amount,
      paidAmount: o.paid_amount,
      paymentMethod: o.payment_method,
      itemCount: o.item_count,
      createdAt: o.created_at,
    })),
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    statuses: ORDER_STATUSES,
  });
});

router.get('/orders/:id', (req, res) => {
  const order = getOrderFull(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
  res.json({ order, statuses: ORDER_STATUSES });
});

router.patch('/orders/:id', (req, res) => {
  const id = Number(req.params.id);
  const d = z
    .object({
      status: z.enum(Object.keys(ORDER_STATUSES)).optional(),
      note: z.string().trim().max(1000).optional(),
      paidAmount: z.coerce.number().nonnegative().optional(),
    })
    .parse(req.body);
  const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Commande introuvable.' });
  if (d.paidAmount !== undefined) {
    db.prepare("UPDATE orders SET paid_amount = ?, updated_at = datetime('now') WHERE id = ?").run(d.paidAmount, id);
  }
  if (d.status || d.note) updateStatusTx(id, d.status || current.status, d.note);
  res.json({ order: getOrderFull(id), statuses: ORDER_STATUSES });
});

module.exports = router;
