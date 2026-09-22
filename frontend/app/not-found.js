import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[70vh] flex-col justify-center py-20">
      <h1 className="text-5xl">Page introuvable</h1>
      <p className="mt-4 max-w-lg text-lg text-stone">Ce lien ne mène plus à rien : le produit a peut-être été vendu ou retiré du catalogue.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalogue" className="btn-primary">Voir le catalogue</Link>
        <Link href="/" className="btn-ghost">Retour à l’accueil</Link>
      </div>
    </main>
  );
}
