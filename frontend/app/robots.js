import { SITE_URL } from '@/lib/format';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/panier', '/commande'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
