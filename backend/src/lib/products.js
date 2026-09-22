const db = require('../db');
const { productOut } = require('./serialize');

const BASE = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p JOIN categories c ON c.id = p.category_id
`;

const SORTS = {
  recent: 'p.is_featured DESC, p.id ASC',
  prix_asc: 'p.price IS NULL, p.price ASC',
  prix_desc: 'p.price IS NULL, p.price DESC',
  surface_desc: 'p.surface_m2 IS NULL, p.surface_m2 DESC',
  annee_desc: 'p.year IS NULL, p.year DESC',
};

/**
 * Recherche filtrée et paginée.
 * @param {object} f filtres (category, brand, bedrooms, minPrice, maxPrice, location, q, sort, page, limit, featured, includeUnpublished)
 */
function searchProducts(f = {}) {
  const where = [];
  const params = {};

  if (!f.includeUnpublished) where.push('p.is_published = 1');
  if (f.category) {
    where.push('c.slug = @category');
    params.category = f.category;
  }
  if (f.brand) {
    where.push('p.brand = @brand');
    params.brand = f.brand;
  }
  if (f.location) {
    where.push('p.location = @location');
    params.location = f.location;
  }
  if (f.bedrooms) {
    // "4" signifie "4 chambres et plus"
    const n = Number(f.bedrooms);
    where.push(n >= 4 ? 'p.bedrooms >= @bedrooms' : 'p.bedrooms = @bedrooms');
    params.bedrooms = n;
  }
  if (f.minPrice) {
    where.push('p.price >= @minPrice');
    params.minPrice = Number(f.minPrice);
  }
  if (f.maxPrice) {
    where.push('p.price <= @maxPrice');
    params.maxPrice = Number(f.maxPrice);
  }
  if (f.available) where.push('(p.stock IS NULL OR p.stock > 0)');
  if (f.featured) where.push('p.is_featured = 1');
  if (f.q) {
    where.push('(p.title LIKE @q OR p.brand LIKE @q OR p.model LIKE @q OR p.reference LIKE @q)');
    params.q = `%${f.q}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = SORTS[f.sort] || SORTS.recent;
  const limit = Math.min(Math.max(Number(f.limit) || 24, 1), 100);
  const page = Math.max(Number(f.page) || 1, 1);

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`)
    .get(params).n;

  const rows = db
    .prepare(`${BASE} ${whereSql} ORDER BY ${orderSql} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset: (page - 1) * limit });

  return {
    items: rows.map(productOut),
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    limit,
  };
}

function facets(categorySlug) {
  const params = {};
  let where = 'WHERE p.is_published = 1';
  if (categorySlug) {
    where += ' AND c.slug = @category';
    params.category = categorySlug;
  }
  const from = `FROM products p JOIN categories c ON c.id = p.category_id ${where}`;
  return {
    brands: db
      .prepare(`SELECT p.brand AS value, COUNT(*) AS count ${from} AND p.brand IS NOT NULL GROUP BY p.brand ORDER BY p.brand`)
      .all(params),
    locations: db
      .prepare(`SELECT p.location AS value, COUNT(*) AS count ${from} AND p.location IS NOT NULL GROUP BY p.location ORDER BY count DESC`)
      .all(params),
    bedrooms: db
      .prepare(`SELECT p.bedrooms AS value, COUNT(*) AS count ${from} AND p.bedrooms IS NOT NULL GROUP BY p.bedrooms ORDER BY p.bedrooms`)
      .all(params),
    price: db.prepare(`SELECT MIN(p.price) AS min, MAX(p.price) AS max ${from}`).get(params),
  };
}

function getBySlug(slug, { includeUnpublished = false } = {}) {
  const row = db
    .prepare(`${BASE} WHERE p.slug = ? ${includeUnpublished ? '' : 'AND p.is_published = 1'}`)
    .get(slug);
  return productOut(row);
}

function getById(id) {
  return productOut(db.prepare(`${BASE} WHERE p.id = ?`).get(id));
}

function related(product, limit = 4) {
  const rows = db
    .prepare(
      `${BASE} WHERE p.is_published = 1 AND p.id != @id AND p.category_id = @cat
       AND (p.stock IS NULL OR p.stock > 0)
       ORDER BY (p.brand = @brand) DESC, ABS(COALESCE(p.price, 0) - COALESCE(@price, 0)) ASC LIMIT @limit`
    )
    .all({ id: product.id, cat: product.category.id, brand: product.brand, price: product.price, limit });
  return rows.map(productOut);
}

function listCategories() {
  return db
    .prepare(
      `SELECT c.*, COUNT(p.id) AS count, MIN(p.price) AS min_price
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_published = 1
       GROUP BY c.id ORDER BY c.sort`
    )
    .all()
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: c.count,
      minPrice: c.min_price,
    }));
}

module.exports = { searchProducts, facets, getBySlug, getById, related, listCategories };
