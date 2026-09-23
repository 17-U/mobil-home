require('dotenv').config({ quiet: true });
const path = require('path');

const root = path.resolve(__dirname, '..');

const config = {
  port: Number(process.env.PORT || 4000),
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:4000').replace(/\/$/, ''),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  databasePath: path.resolve(root, process.env.DATABASE_PATH || './data/boutique.db'),
  uploadsDir: path.join(root, 'uploads'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-a-changer',
  depositRate: Math.min(Math.max(Number(process.env.DEPOSIT_RATE || 0.1), 0), 1),
  bank: {
    holder: process.env.BANK_HOLDER || '',
    iban: process.env.BANK_IBAN || '',
    bic: process.env.BANK_BIC || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  shop: {
    name: process.env.SHOP_NAME || 'Mobil-Home Store',
    phone: process.env.SHOP_PHONE || '',
    email: process.env.SHOP_EMAIL || '',
    whatsapp: process.env.SHOP_WHATSAPP || '',
    social: {
      facebook: process.env.SHOP_FACEBOOK || '',
      instagram: process.env.SHOP_INSTAGRAM || '',
      linkedin: process.env.SHOP_LINKEDIN || '',
    },
  },
};

if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'dev-secret-a-changer') {
  console.error('JWT_SECRET doit être défini en production.');
  process.exit(1);
}

module.exports = config;
