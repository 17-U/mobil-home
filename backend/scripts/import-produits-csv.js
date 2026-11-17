/**
 * Remplace TOUS les produits de la base par ceux de data/produits_mobilhome_concept.csv.
 * Supprime d'abord tous les produits existants (les commandes passées ne sont pas touchées :
 * order_items.product_id passe simplement à NULL grâce à ON DELETE SET NULL).
 *
 *   node scripts/import-produits-csv.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const { slugify, toInt } = require('../src/lib/utils');

const DATA_FILE = path.join(__dirname, '..', 'data', 'produits_mobilhome_concept.csv');

/* ---------- Nettoyage de texte (le fichier source est en UTF-8 propre) ---------- */
/** Nettoie un champ texte sur une seule ligne (titre, marque, point fort...). */
function cleanInline(str) {
  if (!str) return '';
  return String(str).replace(/\s+/g, ' ').trim();
}

/** Nettoie une description multi-paragraphes en conservant les sauts de ligne. */
function cleanDescription(str) {
  if (!str) return '';
  const lines = String(str)
    .split(/\r\n|\r|\n/)
    .map((l) => l.replace(/[ \t]+/g, ' ').trim());
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toFloat(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/* ---------- Parseur CSV (délimiteur ';', champs entre guillemets, multi-lignes) ---------- */
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (text.startsWith('ï»¿')) text = text.slice(3);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ';') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (c === '\r') {
      // ignoré, la fin de ligne est gérée par \n
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

const rawText = fs.readFileSync(DATA_FILE, 'utf8');
const [header, ...dataRows] = parseCsv(rawText);
const records = dataRows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));

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

/* ---------- Import ---------- */
const insert = db.prepare(`
  INSERT INTO products (reference, slug, category_id, title, brand, model, year, condition, origin,
    status_label, location, availability, price, price_from, length_m, width_m, surface_m2, bedrooms, sleeps,
    bathrooms, kitchen, features, price_conditions, description, video_youtube, images, stock, is_published, is_featured)
  VALUES (@reference, @slug, @category_id, @title, @brand, @model, @year, @condition, @origin,
    @status_label, @location, @availability, @price, @price_from, @length_m, @width_m, @surface_m2, @bedrooms, @sleeps,
    @bathrooms, @kitchen, @features, @price_conditions, @description, @video_youtube, @images, @stock, 1, 0)
`);

let added = 0;
let skipped = 0;
const seenRef = new Set();

const run = db.transaction(() => {
  db.exec('DELETE FROM products;');

  for (const row of records) {
    const reference = (row.reference || '').trim();
    if (!reference) {
      skipped++;
      continue;
    }
    if (seenRef.has(reference)) {
      console.warn(`Référence en double "${reference}" — ignorée.`);
      skipped++;
      continue;
    }
    seenRef.add(reference);

    const isNeuf = cleanInline(row.etat).toLowerCase() === 'neuf';
    const condition = isNeuf ? 'neuf' : 'occasion';
    const categoryId = isNeuf ? catId['mobil-homes-neufs'] : catId['mobil-homes-occasion'];

    const features = cleanInline(row.points_forts)
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    const images = [
      ...new Set(
        [row.image_principale, ...String(row.images || '').split('|')]
          .map((s) => (s || '').trim())
          .filter(Boolean)
      ),
    ];

    insert.run({
      reference,
      slug: slugify(reference) || reference,
      category_id: categoryId,
      title: cleanInline(row.titre) || reference,
      brand: cleanInline(row.marque) || null,
      model: cleanInline(row.modele) || null,
      year: toInt(row.annee),
      condition,
      origin: null,
      status_label: null,
      location: null,
      availability: null,
      price: toFloat(row.prix_eur),
      price_from: 0,
      length_m: null,
      width_m: null,
      surface_m2: toFloat(row.superficie_m2),
      bedrooms: toInt(row.chambres),
      sleeps: null,
      bathrooms: toInt(row.salles_eau),
      kitchen: null,
      features: JSON.stringify(features),
      price_conditions: null,
      description: cleanDescription(row.description) || null,
      video_youtube: cleanInline(row.video_youtube) || null,
      images: JSON.stringify(images),
      stock: isNeuf ? null : 1,
    });
    added++;
  }
});

run();

console.log(`${added} produit(s) importé(s)${skipped ? `, ${skipped} ignoré(s)` : ''}.`);
console.log(`Total en base : ${db.prepare('SELECT COUNT(*) n FROM products').get().n}`);
