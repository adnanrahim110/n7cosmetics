export default function sitemap() {
  const siteUrl = (process.env.APP_URL || "https://n7cosmetics.co.uk").replace(/\/$/, "");
  const routes = [
    { path: "", priority: 1 },
    { path: "/n7", priority: 0.9 },
    { path: "/yusuf-bhai-originals", priority: 0.9 },
    { path: "/premium-collection", priority: 0.9 },
    { path: "/recreations", priority: 0.9 },
    { path: "/sale", priority: 0.8 },
    { path: "/bundles", priority: 0.8 },
    { path: "/about", priority: 0.8 },
    { path: "/contact", priority: 0.6 },
    { path: "/shipping-returns", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
