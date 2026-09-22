'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';

const EMPTY = {
  reference: '', slug: '', categoryId: '', title: '', brand: '', model: '', year: '', condition: 'occasion',
  origin: '', statusLabel: '', location: '', availability: '', price: '', priceFrom: false,
  lengthM: '', widthM: '', surfaceM2: '', bedrooms: '', sleeps: '', bathrooms: '', kitchen: '',
  features: [], priceConditions: '', description: '', images: [], stock: '', isPublished: true, isFeatured: false,
};

const CONDITION_BY_CATEGORY = { 'mobil-homes-neufs': 'neuf', 'mobil-homes-occasion': 'occasion', 'pieces-detachees': 'piece' };

function toForm(p) {
  const f = { ...EMPTY };
  for (const k of Object.keys(EMPTY)) if (p[k] !== undefined && p[k] !== null) f[k] = p[k];
  f.categoryId = p.category?.id ?? '';
  return f;
}

export default function ProductForm({ product }) {
  const router = useRouter();
  const [form, setForm] = useState(product ? toForm(product) : EMPTY);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    adminApi('/categories').then((c) => {
      setCategories(c);
      if (!product && c[1]) setForm((f) => ({ ...f, categoryId: f.categoryId || c[1].id }));
    });
  }, [product]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function onCategory(e) {
    const id = Number(e.target.value);
    const cat = categories.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      categoryId: id,
      condition: CONDITION_BY_CATEGORY[cat?.slug] || f.condition,
      stock: f.stock === '' && CONDITION_BY_CATEGORY[cat?.slug] === 'occasion' ? 1 : f.stock,
    }));
  }

  async function upload(files) {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    try {
      const r = await adminApi('/uploads', { method: 'POST', body: fd });
      setForm((f) => ({ ...f, images: [...f.images, ...r.urls] }));
    } catch (e) {
      setMessage(e.message);
    } finally {
      setUploading(false);
    }
  }

  function moveImage(i, d) {
    setForm((f) => {
      const images = [...f.images];
      const j = i + d;
      if (j < 0 || j >= images.length) return f;
      [images[i], images[j]] = [images[j], images[i]];
      return { ...f, images };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage('');
    try {
      const saved = await adminApi(product ? `/products/${product.id}` : '/products', {
        method: product ? 'PUT' : 'POST',
        body: { ...form, features: form.features.map((x) => x.trim()).filter(Boolean) },
      });
      if (product) {
        setForm(toForm(saved));
        setMessage('Modifications enregistrées.');
      } else {
        router.replace(`/admin/produits/${saved.id}?cree=1`);
      }
    } catch (err) {
      const fe = {};
      for (const f of err.data?.fields || []) fe[f.path.split('.')[0]] = f.message;
      setErrors(fe);
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isHome = form.condition !== 'piece';
  const input = (k, label, { wrap = '', ...props } = {}) => (
    <div className={wrap}>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} value={form[k] ?? ''} onChange={set(k)} className={`field ${errors[k] ? 'border-danger' : ''}`} {...props} />
      {errors[k] && <p className="mt-1 text-sm text-danger">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="space-y-5 rounded-md bg-white p-6">
          <h2 className="text-xl">Informations</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {input('title', 'Titre', { required: true, wrap: 'sm:col-span-2' })}
            {input('reference', 'Référence', { required: true, placeholder: 'occasion-051' })}
            <div>
              <label htmlFor="categoryId" className="label">Catégorie</label>
              <select id="categoryId" value={form.categoryId} onChange={onCategory} className="field" required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {input('statusLabel', 'Phrase d’accroche', { placeholder: 'Mobil-home d’occasion sur notre parc', wrap: 'sm:col-span-2' })}
            {isHome && input('brand', 'Marque')}
            {isHome && input('model', 'Modèle')}
            {isHome && input('year', 'Année', { type: 'number', min: 1970, max: 2100 })}
            {isHome && (
              <div>
                <label htmlFor="origin" className="label">Fabrication</label>
                <select id="origin" value={form.origin || ''} onChange={set('origin')} className="field">
                  <option value="">Non précisée</option>
                  <option>Anglais</option>
                  <option>Français</option>
                </select>
              </div>
            )}
            {form.condition === 'occasion' && input('location', 'Emplacement', { placeholder: 'La Sensation, notre parc, à sortir…' })}
            {form.condition === 'neuf' && input('availability', 'Disponibilité', { placeholder: 'Disponible à la commande en 2 et 3 chambres', wrap: 'sm:col-span-2' })}
          </div>
        </section>

        {isHome && (
          <section className="space-y-5 rounded-md bg-white p-6">
            <h2 className="text-xl">Dimensions et pièces</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {input('lengthM', 'Longueur (m)', { type: 'number', step: '0.01', min: 0 })}
              {input('widthM', 'Largeur (m)', { type: 'number', step: '0.01', min: 0 })}
              {input('surfaceM2', 'Surface (m²)', { type: 'number', step: '0.01', min: 0, placeholder: 'calculée si vide' })}
              {input('bedrooms', 'Chambres', { type: 'number', min: 0 })}
              {input('sleeps', 'Couchages', { type: 'number', min: 0 })}
              {input('bathrooms', 'Salles d’eau', { type: 'number', min: 0 })}
            </div>
            {input('kitchen', 'Cuisine équipée', { placeholder: 'réfrigérateur-congélateur, plaque 4 feux, hotte' })}
            <div>
              <label htmlFor="features" className="label">Équipements (un par ligne)</label>
              <textarea
                id="features"
                rows={5}
                className="field"
                value={form.features.join('\n')}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value.split('\n') }))}
                onBlur={() => setForm((f) => ({ ...f, features: f.features.map((s) => s.trim()).filter(Boolean) }))}
              />
            </div>
          </section>
        )}

        <section className="space-y-5 rounded-md bg-white p-6">
          <h2 className="text-xl">Photos</h2>
          <p className="text-sm text-stone">La première photo sert de vignette dans le catalogue.</p>
          {form.images.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {form.images.map((src, i) => (
                <li key={src + i} className="rounded-md border border-line p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" />
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="space-x-2">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Déplacer avant" className="font-bold disabled:opacity-30">‹</button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Déplacer après" className="font-bold disabled:opacity-30">›</button>
                    </span>
                    <button type="button" className="font-semibold text-danger" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}>
                      Retirer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <label className="btn-ghost cursor-pointer py-2.5">
              {uploading ? 'Envoi…' : 'Envoyer des photos'}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={uploading} />
            </label>
            <div className="flex min-w-[260px] flex-1 gap-2">
              <input type="url" placeholder="ou coller l’adresse d’une image" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="field" />
              <button
                type="button"
                className="btn-ghost py-2.5"
                onClick={() => {
                  if (newUrl.trim()) setForm((f) => ({ ...f, images: [...f.images, newUrl.trim()] }));
                  setNewUrl('');
                }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-md bg-white p-6">
          <h2 className="text-xl">Description</h2>
          <textarea id="description" rows={8} value={form.description || ''} onChange={set('description')} className="field" />
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-5 rounded-md bg-white p-6 xl:sticky xl:top-6">
          <h2 className="text-xl">Prix et stock</h2>
          {input('price', 'Prix TTC (€)', { type: 'number', min: 0, step: '1', placeholder: 'vide = sur devis' })}
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={form.priceFrom} onChange={set('priceFrom')} className="size-4 accent-pine" />
            Afficher « à partir de »
          </label>
          <div>
            <label htmlFor="priceConditions" className="label">Ce que comprend le prix</label>
            <textarea id="priceConditions" rows={3} value={form.priceConditions || ''} onChange={set('priceConditions')} className="field" />
          </div>
          {input('stock', 'Stock', { type: 'number', min: 0, placeholder: 'vide = fabriqué à la commande' })}
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} className="size-4 accent-pine" />
            Visible sur la boutique
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} className="size-4 accent-pine" />
            À la une sur l’accueil
          </label>
          {input('slug', 'Adresse de la page', { placeholder: 'générée depuis le titre' })}

          {message && <p className={`rounded-md p-3 text-sm ${Object.keys(errors).length ? 'bg-[#f6dcda] text-danger' : 'bg-mist'}`} role="status">{message}</p>}
          <button className="btn-pine w-full" disabled={saving}>
            {saving ? 'Enregistrement…' : product ? 'Enregistrer les modifications' : 'Créer le produit'}
          </button>
          {product?.isPublished && (
            <a href={`/produit/${product.slug}`} target="_blank" rel="noreferrer" className="block text-center text-sm font-semibold text-pine underline underline-offset-4">
              Voir sur la boutique
            </a>
          )}
        </section>
      </div>
    </form>
  );
}
