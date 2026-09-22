const { ZodError } = require('zod');

function notFound(req, res) {
  res.status(404).json({ error: 'Ressource introuvable.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Certains champs sont invalides.',
      fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Cette référence ou ce lien existe déjà.' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image trop lourde (8 Mo maximum).' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Erreur serveur, réessayez dans un instant.' : err.message,
    details: err.details,
  });
}

module.exports = { notFound, errorHandler };
