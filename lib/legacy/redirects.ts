interface LegacyRedirect {
  source: string;
  destination: string;
  permanent: true;
}

// Verified against the imported WordPress product IDs and their current slugs.
const renamedProducts: Record<string, string> = {
  "rendevous": "rendezvous",
  "legendary": "legendry",
  "costa-azzura": "costa-azzurra",
  "jadore": "j-adore",
  "blue-de-chanel": "bleu-de-chanel",
  "bvlgari-le-gemme": "bvlgari-le-gemme-tygar",
  "myrhh-and-tonka": "myrrh-tonka",
  "moonlight-pathcholi": "moonlight-patchouli",
  "allure-home-sport": "allure-homme-sport",
  "terre-de-hermes": "terre-d-hermes",
  "devoir-elixer": "devoir-elixir",
};

const bundleSlugs = [
  "allure-home-sport-sauvage-legendary",
  "city-walk-xs-night-extreme-indian-funk",
  "dark-moon-indian-funk-domestic-noir",
  "goddess-burberry-good-girl-forbidden-love",
  "jadore-ysl-libre-french-oud",
  "noir-extreme-forbidden-love-french-oud",
];

const collectionPaths: Record<string, string> = {
  "yusuf-bhai-originals": "/yusuf-bhai-originals",
  "recreations": "/recreations",
  "recreation": "/recreations",
  "recreations/yusuf-bhai-inspired-by": "/recreations",
  "premium-collection": "/premium-collection",
  "bundles": "/bundles",
};

const pagePaths: Record<string, string> = {
  "/home": "/",
  "/contact-us": "/contact",
  "/privacy-policy": "/privacy",
  "/shipping-and-returns": "/shipping-returns",
  "/buy-5-get-1-free": "/sale/buy-5-get-1-free",
};

export function legacyRedirects(): LegacyRedirect[] {
  const redirects: LegacyRedirect[] = [];
  // Specific product and bundle mappings precede the unchanged-slug fallback.
  for (const [oldSlug, slug] of Object.entries(renamedProducts)) {
    for (const prefix of ["product", "products"]) {
      redirects.push({ source: `/${prefix}/${oldSlug}`, destination: `/products/${slug}`, permanent: true });
    }
  }
  for (const slug of bundleSlugs) {
    for (const prefix of ["product", "products"]) {
      redirects.push({ source: `/${prefix}/${slug}`, destination: `/bundles/${slug}`, permanent: true });
    }
  }
  redirects.push({ source: "/product/:slug", destination: "/products/:slug", permanent: true });

  for (const [path, destination] of Object.entries(collectionPaths)) {
    redirects.push(
      { source: `/product-category/${path}`, destination, permanent: true },
      { source: `/product-category/${path}/page/:page(\\d+)`, destination, permanent: true },
    );
  }
  for (const suffix of ["", "/page/:page(\\d+)"]) {
    redirects.push({
      source: `/product-category/yusuf-bhai-originals/:category(deja-vu|noble|teeb)${suffix}`,
      destination: "/yusuf-bhai-originals/:category",
      permanent: true,
    });
  }
  for (const [source, destination] of Object.entries(pagePaths)) {
    redirects.push({ source, destination, permanent: true });
  }
  return redirects;
}
