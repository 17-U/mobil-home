import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProduct() {
  return (
    <div className="space-y-6">
      <Link href="/admin/produits" className="text-sm font-semibold text-pine">Retour aux produits</Link>
      <h1 className="text-3xl">Nouveau produit</h1>
      <ProductForm />
    </div>
  );
}
