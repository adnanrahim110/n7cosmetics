import type { HeroProductPresentation, HomepageProduct } from "./types";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeHeroProductPresentations(value: unknown): HeroProductPresentation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Record<string, unknown>;
    const productId = stringValue(candidate.productId).trim();
    if (!/^[1-9]\d*$/.test(productId)) return [];
    const rawImage = stringValue(candidate.image).trim();
    const image = rawImage.startsWith("/") || /^https?:\/\//i.test(rawImage) ? rawImage : "";
    return [{
      productId,
      title: stringValue(candidate.title),
      tagline: stringValue(candidate.tagline),
      description: stringValue(candidate.description),
      image,
    }];
  });
}

export function applyHeroProductPresentations(
  products: HomepageProduct[],
  presentations: HeroProductPresentation[],
): HomepageProduct[] {
  const byProductId = new Map(presentations.map((presentation) => [presentation.productId, presentation]));
  return products.map((product) => {
    const presentation = byProductId.get(product.id);
    if (!presentation) return product;
    return {
      ...product,
      name: presentation.title.trim() || product.name,
      tagline: presentation.tagline.trim() || product.tagline,
      description: presentation.description.trim() || product.description,
      image: presentation.image.trim() || product.image,
    };
  });
}
