const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
require('./db');
const publicRoutes = require('./routes/public');
const { router: orderRoutes, stripeWebhook } = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.frontendUrl.split(',').map((s) => s.trim()),
    credentials: true,
  })
);

// Le webhook Stripe a besoin du corps brut : déclaré avant express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '30d', immutable: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', publicRoutes);
app.use(
  '/api/orders',
  rateLimit({ windowMs: 10 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }),
  orderRoutes
);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API prête sur ${config.publicUrl} (port ${config.port})`);
});
