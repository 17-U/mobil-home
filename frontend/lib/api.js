const PUBLIC_API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const SERVER_API = (process.env.API_URL || PUBLIC_API).replace(/\/$/, '');

export function apiBase() {
  return typeof window === 'undefined' ? SERVER_API : PUBLIC_API;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Appel à l'API Node.
 * Côté serveur, `revalidate` règle le cache Next (en secondes).
 */
export async function api(path, { method = 'GET', body, token, revalidate = 30, headers = {}, ...rest } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`${apiBase()}/api${path}`, {
    method,
    headers: {
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    ...(method === 'GET' && typeof window === 'undefined' ? { next: { revalidate } } : { cache: 'no-store' }),
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Erreur ${res.status}`, res.status, data);
  return data;
}
