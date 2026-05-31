/** @type {import('next').NextConfig} */
const apiRemotePatterns = [];

if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    apiRemotePatterns.push({
      protocol: apiUrl.protocol.replace(':', ''),
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      pathname: '/uploads/**',
    });
    apiRemotePatterns.push({
      protocol: apiUrl.protocol.replace(':', ''),
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      pathname: '/api/uploads/**',
    });
  } catch {
    // Ignore invalid local env values so Next can still boot and show the real config issue elsewhere.
  }
}

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const internalApiOrigin = process.env.INTERNAL_API_ORIGIN || 'http://backend:5000';

    return [
      {
        source: '/api/:path*',
        destination: `${internalApiOrigin}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${internalApiOrigin}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'logam-mulia-production.up.railway.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      ...apiRemotePatterns,
    ],
  },
};

export default nextConfig;
