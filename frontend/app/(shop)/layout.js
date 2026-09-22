import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Pages rendues à la demande : le build ne dépend pas de l'API, les appels restent mis en cache 30 à 300 s.
export const dynamic = 'force-dynamic';

export default function ShopLayout({ children }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-sun focus:px-4 focus:py-2">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}
