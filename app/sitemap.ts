import type { MetadataRoute } from "next";
import { getAvailableSaleNavigationItems } from "@/lib/commerce/sales";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.APP_URL || "https://n7cosmetics.co.uk").replace(/\/$/, "");
  let sales: Awaited<ReturnType<typeof getAvailableSaleNavigationItems>> = [];

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
  ];

  return routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
