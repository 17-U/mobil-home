/**
 * Importe le catalogue (data/mobilhomes.json + photos_sans_fiche.csv) dans SQLite.
 *   npm run seed            -> ajoute les produits manquants (ne touche pas aux produits existants)
 *   npm run seed -- --reset -> vide produits + commandes puis réimporte tout
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const { slugify, parseDimensions, toInt } = require('../src/lib/utils');

const DATA = path.join(__dirname, '..', 'data');
const reset = process.argv.includes('--reset');
const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'mobilhomes.json'), 'utf8'));

if (reset) {
  db.exec('DELETE FROM order_events; DELETE FROM order_items; DELETE FROM orders; DELETE FROM products;');
  console.log('Produits et commandes supprimés.');
}

/* ---------- Catégories ---------- */
const pieceFamilies = raw.infos_pieces_detachees?.categories || [];
const categories = [
  {
    slug: 'mobil-homes-neufs',
    name: 'Mobil-homes neufs',
    description:
      'Modèles 2025 avec garantie constructeur de 10 ans. Livraison jusqu’à 100 km, installation, raccordements et terrasse inclus.',
    sort: 1,
  },
  {
    slug: 'mobil-homes-occasion',
    name: 'Mobil-homes d’occasion',
    description:
      'Mobil-homes visibles sur nos campings ou sur notre parc. Chaque modèle est unique : il est réservé dès la commande.',
    sort: 2,
  },
  {
    slug: 'pieces-detachees',
    name: 'Pièces détachées',
    description:
      'Pièces pour l’entretien de votre mobil-home, sur devis gratuit.' +
      (pieceFamilies.length ? ` Nous fournissons aussi : ${pieceFamilies.join(', ').toLowerCase()}.` : ''),
    sort: 3,
  },
];
const upsertCat = db.prepare(
  `INSERT INTO categories (slug, name, description, sort) VALUES (@slug, @name, @description, @sort)
   ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, sort = excluded.sort`
);
categories.forEach((c) => upsertCat.run(c));
const catId = Object.fromEntries(db.prepare('SELECT slug, id FROM categories').all().map((c) => [c.slug, c.id]));

/* ---------- Photos sans fiche (rattachées quand un modèle correspond) ---------- */
const orphanPhotos = {};
const orphanCsv = path.join(DATA, 'photos_sans_fiche.csv');
if (fs.existsSync(orphanCsv)) {
  const lines = fs.readFileSync(orphanCsv, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    const [gamme, groupe, , photos] = line.split(';');
    orphanPhotos[`${gamme}:${groupe}`] = photos.split('|').map((s) => s.trim()).filter(Boolean);
  }
}

/* ---------- Produits ---------- */
const FEATURED = new Set(['neuf-001', 'neuf-011', 'neuf-020', 'occasion-001', 'occasion-018', 'occasion-030']);

function cleanDescription(text) {
  if (!text) return null;
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i) => l && !(i === 0 && /^MOBIL-HOME/i.test(l)) && !/^En savoir plus/i.test(l))
    .join('\n');
}

const insert = db.prepare(`
  INSERT OR IGNORE INTO products (reference, slug, category_id, title, brand, model, year, condition, origin,
    status_label, location, availability, price, price_from, length_m, width_m, surface_m2, bedrooms, sleeps,
    bathrooms, kitchen, features, price_conditions, description, images, stock, is_published, is_featured)
  VALUES (@reference, @slug, @category_id, @title, @brand, @model, @year, @condition, @origin,
    @status_label, @location, @availability, @price, @price_from, @length_m, @width_m, @surface_m2, @bedrooms, @sleeps,
    @bathrooms, @kitchen, @features, @price_conditions, @description, @images, @stock, 1, @is_featured)
`);

let added = 0;
const usedOrphans = new Set();

const importAll = db.transaction(() => {
  for (const m of raw.mobilhomes) {
    const dims = parseDimensions(m.longueur_x_largeur || m.dimensions);
    const images = [...new Set(m.photos?.length ? m.photos : [m.photo_principale].filter(Boolean))];

    // Rattache les photos orphelines dont le nom de groupe apparaît dans le titre (ex. "andes" -> EUROPA ANDES)
    for (const [key, photos] of Object.entries(orphanPhotos)) {
      const [gamme, groupe] = key.split(':');
      if (gamme === m.gamme && slugify(m.titre).split('-').includes(groupe)) {
        photos.forEach((p) => !images.includes(p) && images.push(p));
        usedOrphans.add(key);
      }
    }

    const isNew = m.gamme === 'neuf';
    const info = insert.run({
      reference: m.reference,
      slug: slugify(`${m.titre}-${m.reference}`),
      category_id: catId[isNew ? 'mobil-homes-neufs' : 'mobil-homes-occasion'],
      title: m.titre,
      brand: m.marque || null,
      model: m.modele || null,
      year: toInt(m.annee),
      condition: isNew ? 'neuf' : 'occasion',
      origin: m.type || null,
      status_label: m.statut || null,
      location: m.emplacement || null,
      availability: m.disponibilite || null,
      price: m.prix_eur ?? null,
      price_from: m.a_partir_de ? 1 : 0,
      length_m: dims.length,
      width_m: dims.width,
      surface_m2: m.surface_m2 ?? (dims.length ? Math.round(dims.length * dims.width * 100) / 100 : null),
      bedrooms: m.nb_chambres ?? null,
      sleeps: m.nb_couchages ?? null,
      bathrooms: m.nb_salles_eau ?? null,
      kitchen: m.cuisine || null,
      features: JSON.stringify(m.equipements || []),
      price_conditions: m.conditions_prix ? m.conditions_prix.replace(/\s+Au-delà/, '. Au-delà') : null,
      description: cleanDescription(m.description_complete),
      images: JSON.stringify(images),
      stock: isNew ? null : 1, // neuf = fabriqué à la commande ; occasion = pièce unique
      is_featured: FEATURED.has(m.reference) ? 1 : 0,
    });
    added += info.changes;
  }

  raw.pieces_detachees.forEach((p, i) => {
    const reference = `piece-${String(i + 1).padStart(3, '0')}`;
    const price = /devis/i.test(p.prix) ? null : parseFloat(String(p.prix).replace(/[^\d,.]/g, '').replace(',', '.')) || null;
    const info = insert.run({
      reference,
      slug: slugify(`${p.piece}-${reference}`),
      category_id: catId['pieces-detachees'],
      title: p.piece,
      brand: null,
      model: null,
      year: null,
      condition: 'piece',
      origin: null,
      status_label: 'Pièce détachée pour mobil-home',
      location: null,
      availability: null,
      price,
      price_from: 0,
      length_m: null,
      width_m: null,
      surface_m2: null,
      bedrooms: null,
      sleeps: null,
      bathrooms: null,
      kitchen: null,
      features: '[]',
      price_conditions: null,
      description: p.description || null,
      images: JSON.stringify([p.photo].filter(Boolean)),
      stock: null,
      is_featured: 0,
    });
    added += info.changes;
  });
});
importAll();

console.log(`${added} produit(s) ajouté(s). Total en base : ${db.prepare('SELECT COUNT(*) n FROM products').get().n}`);
const unused = Object.keys(orphanPhotos).filter((k) => !usedOrphans.has(k));
if (unused.length) {
  console.log(`Photos sans fiche non rattachées (créez la fiche dans l'admin) : ${unused.join(', ')}`);
}

/* ---------- Premier compte admin ---------- */
if (!db.prepare('SELECT COUNT(*) n FROM admins').get().n) {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMoi123!';
  db.prepare('INSERT INTO admins (email, name, password_hash) VALUES (?, ?, ?)').run(
    email.toLowerCase(),
    'Administrateur',
    bcrypt.hashSync(password, 10)
  );
  console.log(`Compte admin créé : ${email} (pensez à changer le mot de passe).`);
}
