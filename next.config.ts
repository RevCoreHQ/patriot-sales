import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'assets.cdn.filesafe.space' },
      // Supabase Storage — matches any project subdomain
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
