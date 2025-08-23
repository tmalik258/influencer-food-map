import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'a.basemaps.cartocdn.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  async rewrites() {
    // API routing configuration
    if (process.env.NODE_ENV === 'development') {
      // In development, proxy to local backend or Docker backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`
        }
      ]
    }
    // In production (Vercel), API routes are handled by serverless functions
    return []
  }
};

export default nextConfig;
