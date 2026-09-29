import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/admin/customers/export": ["./public/fonts/export/*"],
    "/admin/orders/*/receipt": ["./public/fonts/export/*", "./public/imgs/logo-w.png"],
  },
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "350mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
