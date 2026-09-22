const { parseJson } = require('./utils');
const { MAX_QTY } = require('./constants');

function productOut(row) {
  if (!row) return null;
  const images = parseJson(row.images, []);
  const soldOut = row.stock !== null && row.stock <= 0;
  return {
    id: row.id,
    reference: row.reference,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    model: row.model,
    year: row.year,
    condition: row.condition,
    origin: row.origin,
    statusLabel: row.status_label,
    location: row.location,
    availability: row.availability,
    price: row.price,
    priceFrom: !!row.price_from,
    onQuote: row.price === null,
    lengthM: row.length_m,
    widthM: row.width_m,
    surfaceM2: row.surface_m2,
    bedrooms: row.bedrooms,
    sleeps: row.sleeps,
    bathrooms: row.bathrooms,
    kitchen: row.kitchen,
    features: parseJson(row.features, []),
    priceConditions: row.price_conditions,
    description: row.description,
    images,
    image: images[0] || null,
    stock: row.stock,
    soldOut,
    maxQty: row.stock === null ? MAX_QTY[row.condition] || 1 : Math.max(row.stock, 0),
    isPublished: !!row.is_published,
    isFeatured: !!row.is_featured,
    category: row.category_slug
      ? { id: row.category_id, slug: row.category_slug, name: row.category_name }
      : { id: row.category_id },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderOut(row, items = [], events = []) {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    status: row.status,
    customer: {
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      postalCode: row.postal_code,
      city: row.city,
      country: row.country,
    },
    deliveryZone: row.delivery_zone,
    notes: row.notes,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    depositAmount: row.deposit_amount,
    paidAmount: row.paid_amount,
    hasQuoteItems: !!row.has_quote_items,
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      reference: i.reference,
      title: i.title,
      image: i.image,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      slug: i.slug || null,
    })),
    events: events.map((e) => ({ status: e.status, note: e.note, createdAt: e.created_at })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { productOut, orderOut };
