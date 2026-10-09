/** @type {import('next').NextConfig} */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

const allowedImageHosts = new Set([
  'campinglatentation.com',
  'www.mobilhomeconcept.com',
  'mobilhomeconcept.com',
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
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig;
