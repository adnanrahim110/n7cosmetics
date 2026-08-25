export default function robots() {
  const siteUrl = (process.env.APP_URL || 'https://n7cosmetics.co.uk').replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
