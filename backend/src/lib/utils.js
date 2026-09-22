function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** "04,30 m x 10,10 m" -> { length: 10.1, width: 4.3 } */
function parseDimensions(str) {
  if (!str) return { length: null, width: null };
  const nums = String(str)
    .match(/\d+(?:[.,]\d+)?/g)
    ?.slice(0, 2)
    .map((n) => parseFloat(n.replace(',', '.')));
  if (!nums || nums.length < 2 || nums.some((n) => !n)) return { length: null, width: null };
  return { length: Math.max(...nums), width: Math.min(...nums) };
}

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseJson(v, fallback) {
  try {
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function orderNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MH-${ymd}-${rand}`;
}

module.exports = { slugify, parseDimensions, toInt, parseJson, orderNumber };
