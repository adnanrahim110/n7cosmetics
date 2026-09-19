// These collections have storefront pages for standard products.
// Bundles have their own product routes and catalog manager.
export const categoryCollectionSlugs = [
  "n7", "recreations", "yusuf-bhai-originals", "premium-collection",
] as const;

export type CategoryCollectionSlug = (typeof categoryCollectionSlugs)[number];

export function isCategoryCollectionSlug(value: string): value is CategoryCollectionSlug {
  return (categoryCollectionSlugs as readonly string[]).includes(value);
}

export function categoryHref(collectionSlug: string, categorySlug: string): string {
  return `/${collectionSlug}/${categorySlug}`;
}

export function categoriesMatchCollections(
  categoryIds: string[],
  collectionIds: string[],
  categories: Array<{ id: string; collection_id: string }>,
): boolean {
  const parents = new Map(categories.map((category) => [category.id, category.collection_id]));
  const selectedCollections = new Set(collectionIds);
  return categoryIds.every((id) => {
    const parent = parents.get(id);
    return parent !== undefined && selectedCollections.has(parent);
  });
}
