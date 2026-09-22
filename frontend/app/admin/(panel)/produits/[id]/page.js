'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';
import ProductForm from '@/components/admin/ProductForm';

function Edit() {
  const { id } = useParams();
  const created = useSearchParams().get('cree');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi(`/products/${id}`).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="space-y-6">
      <Link href="/admin/produits" className="text-sm font-semibold text-pine">Retour aux produits</Link>
      <h1 className="text-3xl">{product ? product.title : 'Produit'}</h1>
      {created && <p className="rounded-md bg-white p-3" role="status">Produit créé.</p>}
      {error && <p className="text-danger">{error}</p>}
      {product && <ProductForm key={product.updatedAt} product={product} />}
    </div>
  );
}

export default function EditProduct() {
  return (
    <Suspense>
      <Edit />
    </Suspense>
  );
}
