/**
 * Télécharge les photos encore hébergées sur un domaine externe (campinglatentation.com)
 * et les réécrit en local (backend/uploads/), en mettant à jour products.images en base.
 * Les commandes (order_items.image) ne sont pas touchées : ce sont des instantanés historiques.
 *
 *   npm run migrate-images           -> migre tout ce qui n'est pas déjà en local
 *   npm run migrate-images -- --dry  -> liste ce qui serait fait, sans rien télécharger ni écrire
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../src/db');
const config = require('../src/config');

const dryRun = process.argv.includes('--dry');
const EXTERNAL_HOST = 'campinglatentation.com';
const RETRIES = 3;
const TIMEOUT_MS = 20_000;

fs.mkdirSync(config.uploadsDir, { recursive: true });

async function downloadOne(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      clearTimeout(timer);
      if (attempt === RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

function localFilenameFor(url) {
  const ext = (path.extname(new URL(url).pathname) || '.jpg').toLowerCase();
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  return `migrated-${hash}${ext}`;
}

async function main() {
  const rows = db.prepare('SELECT id, reference, images FROM products').all();

  // sourceUrl -> localUrl, pour ne télécharger qu'une fois les photos partagées entre produits
  const cache = new Map();
  let downloaded = 0;
  let reused = 0;
  let skippedLocal = 0;
  let failed = [];
  let updatedProducts = 0;

  for (const row of rows) {
    let images;
    try {
      images = JSON.parse(row.images || '[]');
    } catch {
      console.warn(`[${row.reference}] images JSON illisible, ignoré.`);
      continue;
    }

    let changed = false;
    const nextImages = [];

    for (const url of images) {
      let host;
      try {
        host = new URL(url).hostname;
      } catch {
        nextImages.push(url);
        continue;
      }

      if (host !== EXTERNAL_HOST) {
        skippedLocal++;
        nextImages.push(url);
        continue;
      }

      if (cache.has(url)) {
        nextImages.push(cache.get(url));
        changed = true;
        reused++;
        continue;
      }

      const filename = localFilenameFor(url);
      const destPath = path.join(config.uploadsDir, filename);
      const localUrl = `${config.publicUrl}/uploads/${filename}`;

      if (fs.existsSync(destPath)) {
        cache.set(url, localUrl);
        nextImages.push(localUrl);
        changed = true;
        reused++;
        continue;
      }

      if (dryRun) {
        console.log(`[dry] téléchargerait ${url} -> ${filename}`);
        cache.set(url, localUrl);
        nextImages.push(localUrl);
        changed = true;
        continue;
      }

      try {
        const buf = await downloadOne(url);
        fs.writeFileSync(destPath, buf);
        cache.set(url, localUrl);
        nextImages.push(localUrl);
        changed = true;
        downloaded++;
        if (downloaded % 25 === 0) console.log(`${downloaded} images téléchargées...`);
      } catch (err) {
        console.warn(`[${row.reference}] échec sur ${url} : ${err.message}`);
        failed.push({ reference: row.reference, url, error: err.message });
        nextImages.push(url); // on garde l'URL distante plutôt que de perdre la photo
      }
    }

    if (changed) {
      updatedProducts++;
      if (!dryRun) {
        db.prepare('UPDATE products SET images = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
          JSON.stringify(nextImages),
          row.id
        );
      }
    }
  }

  console.log('\n--- Résumé ---');
  console.log(`Produits mis à jour : ${updatedProducts} / ${rows.length}`);
  console.log(`Images téléchargées  : ${downloaded}`);
  console.log(`Images réutilisées (déjà en cache) : ${reused}`);
  console.log(`Déjà locales / autres hôtes (ignorées) : ${skippedLocal}`);
  if (failed.length) {
    console.log(`\nÉchecs (${failed.length}) — URL distante conservée pour ces photos :`);
    for (const f of failed) console.log(`  [${f.reference}] ${f.url} — ${f.error}`);
  }
  if (dryRun) console.log('\n(dry-run : rien n\'a été écrit sur disque ni en base)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
