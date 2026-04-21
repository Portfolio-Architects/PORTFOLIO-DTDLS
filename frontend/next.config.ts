import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : {
    turbopack: {
      root: path.resolve(import.meta.dirname, '..'),
    }
  }),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      // 개발 모드: 모든 캐시 비활성화 → 항상 최신 코드 반영
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
            { key: "Pragma", value: "no-cache" },
            { key: "Expires", value: "0" },
          ],
        },
      ];
    }
    // 프로덕션: 기존 캐시 정책 유지
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
