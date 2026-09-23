import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { api } from '@/lib/api';

// Pages rendues à la demande : le build ne dépend pas de l'API, les appels restent mis en cache 30 à 300 s.
export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }) {
  const settings = await api('/settings', { revalidate: 300 }).catch(() => null);

  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-sun focus:px-4 focus:py-2">
        Aller au contenu
      </a>
      <Header phone={settings?.shop?.phone} />
      <main id="contenu">{children}</main>
      <Footer />
      <WhatsAppButton phone={settings?.shop?.whatsapp} />
    </>
  );
}
