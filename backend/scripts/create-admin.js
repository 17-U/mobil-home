/**
 * Crée ou met à jour un compte admin.
 *   npm run create-admin -- email@domaine.fr MotDePasse "Nom affiché"
 */
const bcrypt = require('bcryptjs');
const db = require('../src/db');

const [email, password, name = 'Administrateur'] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Usage : npm run create-admin -- email motdepasse(8 caractères min.) "Nom"');
  process.exit(1);
}
db.prepare(
  `INSERT INTO admins (email, name, password_hash) VALUES (?, ?, ?)
   ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`
).run(email.toLowerCase(), name, bcrypt.hashSync(password, 10));
console.log(`Admin ${email} enregistré.`);
