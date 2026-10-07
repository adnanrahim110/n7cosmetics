import type { NextConfig } from "next";
import { storefrontAssets } from "./lib/media/storefront-assets";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/admin/customers/export": ["./public/fonts/export/*"],
    "/admin/orders/*/receipt": ["./public/fonts/export/*", "./public/imgs/logo-w.png"],
  },
  reactCompiler: true,
  experimental: {
    // Send the existing Tailwind/font/slider styles with HTML, avoiding a blocking waterfall.
    inlineCss: true,
    optimizePackageImports: ["swiper/modules"],
    serverActions: {
      bodySizeLimit: "350mb",
    },
  },
  images: {
    imageSizes: [32, 48, 64, 96, 128, 192, 256, 320, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/product-category/yusuf-bhai-originals",
        destination: "/yusuf-bhai-originals",
        permanent: true,
      },
      {
        source: "/product-category/yusuf-bhai-originals/page/:page(\\d+)",
        destination: "/yusuf-bhai-originals",
        permanent: true,
      },
      {
        source: "/product-category/yusuf-bhai-originals/:category(deja-vu|noble|teeb)",
        destination: "/yusuf-bhai-originals/:category",
        permanent: true,
      },
      {
        source: "/product-category/yusuf-bhai-originals/:category(deja-vu|noble|teeb)/page/:page(\\d+)",
        destination: "/yusuf-bhai-originals/:category",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Uploaded /media URLs already carry their own immutable cache policy.
        source: "/:directory(imgs|videos)/:asset*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      ...Object.values(storefrontAssets).map(source => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      })),
    ];
  },
};

export default nextConfig;
