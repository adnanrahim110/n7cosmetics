import { isCategoryCollectionSlug, type CategoryCollectionSlug } from "../commerce/category-config";

export interface MetaCategoryPath {
  collectionSlug: CategoryCollectionSlug | "bundles";
  categorySlug?: string;
}

// Product, checkout and informational routes must never become category views.
export function metaCategoryPath(path: string): MetaCategoryPath | null {
  const match = path.match(/^\/([a-z0-9-]+)(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?\/?$/);
  if (!match) return null;
  const [, collectionSlug, categorySlug] = match;
  if (isCategoryCollectionSlug(collectionSlug)) return { collectionSlug, ...(categorySlug ? { categorySlug } : {}) };
  if (!categorySlug && collectionSlug === "bundles") return { collectionSlug };
  return null;
}
