export default function sitemap() {
  const routes = [
    { path: "", priority: 1 },
    { path: "/yusuf-bhai-originals", priority: 0.9 },
    { path: "/recreations", priority: 0.9 },
    { path: "/bundles", priority: 0.8 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `https://n7cosmetics.co.uk${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
