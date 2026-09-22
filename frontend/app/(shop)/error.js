'use client';

export default function Error({ reset }) {
  return (
    <div className="container-page py-20">
      <h1 className="text-4xl">Le catalogue ne répond pas</h1>
      <p className="mt-4 max-w-lg text-stone">Le serveur de la boutique est injoignable pour le moment. Réessayez dans quelques secondes.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Réessayer</button>
    </div>
  );
}
