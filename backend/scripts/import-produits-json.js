/**
 * Remplace TOUS les produits de la base par ceux de data/produits-import.json.
 * Supprime d'abord tous les produits existants (les commandes passées ne sont pas touchées :
 * order_items.product_id passe simplement à NULL grâce à ON DELETE SET NULL).
 *
 *   node scripts/import-produits-json.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const { slugify, parseDimensions, toInt } = require('../src/lib/utils');

const DATA_FILE = path.join(__dirname, '..', 'data', 'produits-import.json');

/* ---------- Correction de l'encodage mojibake (UTF-8 relu en Latin-1) ----------
 * Le texte source a perdu, lors de sa récupération, certains octets intermédiaires
 * (plage 0x80-0x9F) de séquences UTF-8 mal interprétées. On les réinsère avant de
 * redécoder l'ensemble en UTF-8. */
function fixMojibake(str) {
  if (!str) return str;
  const NBSP = String.fromCharCode(0x00A0);
  const B82 = String.fromCharCode(0x0082);
  const B80 = String.fromCharCode(0x0080);
  const B99 = String.fromCharCode(0x0099);
  let s = String(str)
    .replace(/Ã(?= |$)/g, 'Ã' + NBSP) // reconstruit l'octet 0xA0 perdu (=> a-grave)
    .replace(/â¬/g, 'â' + B82 + '¬') // reconstruit l'octet 0x82 perdu (=> euro)
    .replace(/â¦/g, 'â' + B80 + '¦') // reconstruit l'octet 0x80 perdu (=> ellipsis)
    .replace(/â(?=[a-zA-Z])/g, 'â' + B80 + B99); // reconstruit 0x80 0x99 (=> apostrophe)
  s = Buffer.from(s, 'latin1').toString('utf8');
  return s.replace(/\s+/g, ' ').trim();
}

const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

/* ---------- Catégories ---------- */
const categories = [
  { slug: 'mobil-homes-neufs', name: 'Mobil-homes neufs', sort: 1 },
  { slug: 'mobil-homes-occasion', name: 'Mobil-homes d’occasion', sort: 2 },
  { slug: 'abris-de-jardin', name: 'Abris de jardin', sort: 3 },
  { slug: 'pieces-detachees', name: 'Pièces détachées', sort: 4 },
];
const upsertCat = db.prepare(
  `INSERT INTO categories (slug, name, description, sort) VALUES (@slug, @name, '', @sort)
   ON CONFLICT(slug) DO UPDATE SET sort = excluded.sort`
);
categories.forEach((c) => upsertCat.run({ ...c, description: '' }));
const catId = Object.fromEntries(db.prepare('SELECT slug, id FROM categories').all().map((c) => [c.slug, c.id]));

const CATEGORY_MAP = {
  'Mobil-home neuf': catId['mobil-homes-neufs'],
  "Mobil-home d'occasion": catId['mobil-homes-occasion'],
  'Abris de jardin': catId['abris-de-jardin'],
};

/* ---------- Helpers ---------- */
function parseSleeps(str) {
  const nums = String(str || '').match(/\d+/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));
}

function slugFromUrl(url, fallback) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return slugify(parts[parts.length - 1] || fallback);
  } catch {
    return slugify(fallback);
  }
}

/* ---------- Import ---------- */
const insert = db.prepare(`
  INSERT INTO products (reference, slug, category_id, title, brand, model, year, condition, origin,
    status_label, location, availability, price, price_from, length_m, width_m, surface_m2, bedrooms, sleeps,
    bathrooms, kitchen, features, price_conditions, description, images, stock, is_published, is_featured)
  VALUES (@reference, @slug, @category_id, @title, @brand, @model, @year, @condition, @origin,
    @status_label, @location, @availability, @price, @price_from, @length_m, @width_m, @surface_m2, @bedrooms, @sleeps,
    @bathrooms, @kitchen, @features, @price_conditions, @description, @images, @stock, 1, 0)
`);

let added = 0;
let skipped = 0;

const run = db.transaction(() => {
  db.exec('DELETE FROM products;');

  for (const p of raw) {
    const categoryId = CATEGORY_MAP[p.categorie];
    if (!categoryId) {
      console.warn(`Catégorie inconnue "${p.categorie}" pour le produit #${p.id} — ignoré.`);
      skipped++;
      continue;
    }

    const title = fixMojibake(p.libelle);
    const brand = fixMojibake(p.marque) || null;
    const dims = parseDimensions(p.dimensions);
    const surface = p.superficie_m2 ? parseFloat(p.superficie_m2) : dims.length && dims.width ? Math.round(dims.length * dims.width * 100) / 100 : null;
    const isNew = p.categorie !== "Mobil-home d'occasion";
    const isSold = p.statut === 'vendu';
    const priceRange = fixMojibake(p.tranche_prix);
    const yearMatch = title.match(/\b(20\d{2})\b/);

    const images = JSON.stringify(
      [...new Set((p.photos || []).map((ph) => ph.url).concat(p.photo_principale ? [p.photo_principale] : []).filter(Boolean))]
    );

    insert.run({
      reference: `produit-${p.id}`,
      slug: slugFromUrl(p.url, `${title}-${p.id}`),
      category_id: categoryId,
      title,
      brand,
      model: null,
      year: yearMatch ? Number(yearMatch[1]) : null,
      condition: p.categorie === 'Abris de jardin' ? 'neuf' : isNew ? 'neuf' : 'occasion',
      origin: null,
      status_label: priceRange ? `Tarif indicatif : ${priceRange}` : null,
      location: null,
      availability: null,
      price: null, // pas de prix exact dans la source -> affiché "Sur devis"
      price_from: 0,
      length_m: dims.length,
      width_m: dims.width,
      surface_m2: surface,
      bedrooms: toInt(p.chambres),
      sleeps: parseSleeps(p.couchages),
      bathrooms: toInt(p.salles_d_eau),
      kitchen: null,
      features: '[]',
      price_conditions: null,
      description: fixMojibake(p.description_courte) || null,
      images,
      stock: isSold ? 0 : isNew && p.categorie !== 'Abris de jardin' ? null : 1,
    });
    added++;
  }
});

run();

console.log(`${added} produit(s) importé(s)${skipped ? `, ${skipped} ignoré(s)` : ''}.`);
console.log(`Total en base : ${db.prepare('SELECT COUNT(*) n FROM products').get().n}`);
