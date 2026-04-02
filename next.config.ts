import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude pdfjs-dist from server bundles to prevent DOMMatrix errors
      config.externals = {
        ...config.externals,
        "pdfjs-dist": "pdfjs-dist",
      };
    }
    return config;
  },
};

export default nextConfig;
