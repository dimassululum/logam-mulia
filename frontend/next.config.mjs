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
  } catch {
    // Ignore invalid local env values so Next can still boot and show the real config issue elsewhere.
  }
}

const nextConfig = {
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
