import { readScentProfile } from "./scent-profile";

export interface ProductCardDetails {
  reviewCount: number;
  size: string | null;
  scentFamilies: string[];
  isNew: boolean;
  bestSeller?: boolean;
}

export interface ProductCardRow {
  review_count: number | string;
  card_size: string | null;
  scent_profile_json: unknown;
  published_at: Date | string | null;
}

// These queries consistently use p for the product and v for its default variant.
export const productCardColumns = `v.title AS card_size, p.scent_profile_json, p.published_at,
  (SELECT COUNT(*) FROM product_reviews card_review WHERE card_review.product_id = p.id AND card_review.status = 'PUBLISHED') AS review_count`;

export function productCardDetails(row: ProductCardRow, now = Date.now()): ProductCardDetails {
  const published = row.published_at ? new Date(row.published_at).getTime() : NaN;
  const age = now - published;
  const size = row.card_size?.trim();
  return {
    reviewCount: Math.max(0, Number(row.review_count) || 0),
    size: size && size.toLowerCase() !== "default" ? size : null,
    scentFamilies: readScentProfile(row.scent_profile_json).families,
    isNew: Number.isFinite(age) && age >= 0 && age < 30 * 86400000,
  };
}
