/** @type {import('next').NextConfig} */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

const allowedImageHosts = new Set([
  'campinglatentation.com',
  apiUrl.hostname,
  'localhost',
  '127.0.0.1',
]);

const nextConfig = {
  images: {
    remotePatterns: Array.from(allowedImageHosts).map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: '/wp-content/uploads/**',
    })).concat(
      Array.from(allowedImageHosts).map((hostname) => ({
        protocol: apiUrl.protocol.replace(':', ''),
        hostname,
        port: apiUrl.port || undefined,
        pathname: '/uploads/**',
      }))
    ),
    formats: ['image/avif', 'image/webp'],
    // Les photos viennent de sites tiers et ont parfois des temps de réponse très lents ; on évite le proxy d’optimisation Next pour qu’elles s’affichent.
    unoptimized: true,
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig;
