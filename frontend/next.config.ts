import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'yt3.ggpht.com', 'i.ytimg.com'],
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8030/:path*'
      }
    ]
  }
};

export default nextConfig;
