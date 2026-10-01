import type { MetadataRoute } from "next";
import { getAvailableSaleNavigationItems } from "@/lib/commerce/sales";
import { getAvailableCategoryLinks } from "@/lib/commerce/categories";
import { selectRows } from "@/lib/db/query";
import type { RowDataPacket } from "mysql2/promise";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.APP_URL || "https://n7cosmetics.co.uk").replace(/\/$/, "");
  let sales: Awaited<ReturnType<typeof getAvailableSaleNavigationItems>> = [];
  let categories: Awaited<ReturnType<typeof getAvailableCategoryLinks>> = [];
  let products: (RowDataPacket & { slug: string; product_type: string; updated_at: Date })[] = [];

  try {
    sales = await getAvailableSaleNavigationItems();
  } catch (error) {
    // Keep the sitemap available during builds when the optional sales query
    // cannot reach MySQL. Sale URLs will be included again once the database
    // connection is available.
    console.warn(
      "Unable to load sale routes for sitemap; continuing with core routes.",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    categories = await getAvailableCategoryLinks();
  } catch (error) {
    console.warn("Unable to load category routes for sitemap; continuing with core routes.", error instanceof Error ? error.message : error);
  }

  const routes = [
    { path: "", priority: 1 },
    { path: "/n7", priority: 0.9 },
    { path: "/yusuf-bhai-originals", priority: 0.9 },
    { path: "/premium-collection", priority: 0.9 },
    { path: "/recreations", priority: 0.9 },
    { path: "/bundles", priority: 0.8 },
    { path: "/about", priority: 0.8 },
    { path: "/contact", priority: 0.6 },
    { path: "/shipping-returns", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
    ...sales.map((sale) => ({ path: sale.href, priority: 0.8 })),
    ...categories.map((category) => ({ path: category.href, priority: 0.7 })),
  ];

  try {
    products = await selectRows<RowDataPacket & { slug: string; product_type: string; updated_at: Date }>(`SELECT p.slug, p.product_type, GREATEST(p.updated_at, v.updated_at) AS updated_at
      FROM products p JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
      WHERE p.status = 'ACTIVE' AND EXISTS (SELECT 1 FROM product_images image WHERE image.product_id = p.id)`);
  } catch { console.warn("Unable to load product routes for sitemap; continuing with core routes."); }

  return [...routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority,
  })), ...products.map(product => ({
    url: `${siteUrl}/${product.product_type === "BUNDLE" ? "bundles" : "products"}/${product.slug}`,
    lastModified: product.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))];
}
