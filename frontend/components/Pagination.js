import Link from 'next/link';

export default function Pagination({ page, pages, basePath, searchParams }) {
  if (pages <= 1) return null;
  const href = (p) => {
    const q = new URLSearchParams(searchParams);
    if (p > 1) q.set('page', p);
    else q.delete('page');
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav className="mt-12 flex items-center gap-2" aria-label="Pagination">
      {page > 1 && <Link className="btn-ghost px-4 py-2" href={href(page - 1)}>Page précédente</Link>}
      <span className="px-3 text-stone">Page {page} sur {pages}</span>
      {page < pages && <Link className="btn-ghost px-4 py-2" href={href(page + 1)}>Page suivante</Link>}
    </nav>
  );
}
