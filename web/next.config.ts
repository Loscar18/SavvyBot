import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for Next.js 15
  experimental: {
    serverComponentsExternalPackages: ["crypto-js", "bullmq", "ioredis"],
    ppr: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Webpack configuration for external packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "pg-native": "commonjs pg-native",
        "@modelcontextprotocol/sdk": "commonjs @modelcontextprotocol/sdk",
      });
    }
    return config;
  },
  // Headers for security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
  // Redirects
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
