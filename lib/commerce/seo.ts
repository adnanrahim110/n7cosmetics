import type { StorefrontProduct } from "./catalog";
import type { StorefrontBundle } from "./bundles";
import { stockAvailability } from "./stock";

export function storefrontUrl(path: string): string {
  const fallback = "https://n7cosmetics.co.uk";
  try { return new URL(path, process.env.APP_URL || fallback).toString(); }
  catch { return new URL(path, fallback).toString(); }
}

export function productStructuredData(product: StorefrontProduct | StorefrontBundle, reviews: { totalReviews: number; averageRating: number }) {
  const bundle = "components" in product ? product : undefined;
  const available = stockAvailability({ ...product, components: bundle?.componentsAvailable ? bundle.components.map(component => ({ ...component, available: true })) : [] });
  const url = storefrontUrl(`/${product.productType === "BUNDLE" ? "bundles" : "products"}/${product.slug}`);
  return {
    "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`,
    name: product.name, description: product.shortDescription || product.description || undefined,
    image: product.images.map(image => storefrontUrl(image.url)), url, sku: product.sku,
    brand: { "@type": "Brand", name: product.brand || "N7 Cosmetics" },
    offers: { "@type": "Offer", url, price: (product.pricePence / 100).toFixed(2), priceCurrency: "GBP",
      availability: `https://schema.org/${available.soldOut ? "OutOfStock" : "InStock"}`, itemCondition: "https://schema.org/NewCondition" },
    ...(reviews.totalReviews > 0 && reviews.averageRating >= 1 && reviews.averageRating <= 5 ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.averageRating.toFixed(2), reviewCount: reviews.totalReviews },
    } : {}),
  };
}

// Product text is editable in admin; it must never terminate the JSON-LD script.
export function structuredDataJson(value: unknown): string { return JSON.stringify(value).replace(/</g, "\\u003c"); }
