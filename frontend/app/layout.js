import { Archivo } from 'next/font/google';
import './globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/format';

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const description =
  'Mobil-homes neufs et d’occasion livrés, installés et raccordés, et pièces détachées sur devis. Commandez en ligne avec un acompte.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}, mobil-homes neufs et d’occasion`, template: `%s | ${SITE_NAME}` },
  description,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
    title: `${SITE_NAME}, mobil-homes neufs et d’occasion`,
    description,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={archivo.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
