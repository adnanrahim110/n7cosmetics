import type { ProductListSearchParams } from "@/lib/admin/product-navigation";

export const PRODUCT_STATUS_FILTERS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const PRODUCT_TYPE_FILTERS = ["STANDARD", "BUNDLE"] as const;
export const PRODUCT_AUDIENCE_FILTERS = ["MEN", "WOMEN", "UNISEX", "UNSPECIFIED"] as const;
export const PRODUCT_FEATURED_FILTERS = ["yes", "no"] as const;

export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number] | "";
export type ProductTypeFilter = (typeof PRODUCT_TYPE_FILTERS)[number] | "";
export type ProductAudienceFilter = (typeof PRODUCT_AUDIENCE_FILTERS)[number] | "";
export type ProductFeaturedFilter = (typeof PRODUCT_FEATURED_FILTERS)[number] | "";

export interface ProductListFilters {
  q: string;
  status: ProductStatusFilter;
  productType: ProductTypeFilter;
  audience: ProductAudienceFilter;
  categoryId: string;
  collectionId: string;
  featured: ProductFeaturedFilter;
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function allowedValue<const T extends readonly string[]>(value: string, allowed: T): T[number] | "" {
  return allowed.includes(value) ? value as T[number] : "";
}

function catalogId(value: string): string {
  return /^\d+$/.test(value) ? value : "";
}

export function parseProductListFilters(searchParams: ProductListSearchParams): ProductListFilters {
  return {
    q: firstValue(searchParams.q).trim().slice(0, 100),
    status: allowedValue(firstValue(searchParams.status), PRODUCT_STATUS_FILTERS),
    productType: allowedValue(firstValue(searchParams.type), PRODUCT_TYPE_FILTERS),
    audience: allowedValue(firstValue(searchParams.audience), PRODUCT_AUDIENCE_FILTERS),
    categoryId: catalogId(firstValue(searchParams.category)),
    collectionId: catalogId(firstValue(searchParams.collection)),
    featured: allowedValue(firstValue(searchParams.featured), PRODUCT_FEATURED_FILTERS),
  };
}

export function productListFilterQuery(filters: ProductListFilters): Record<string, string | undefined> {
  return {
    q: filters.q || undefined,
    status: filters.status || undefined,
    type: filters.productType || undefined,
    audience: filters.audience || undefined,
    category: filters.categoryId || undefined,
    collection: filters.collectionId || undefined,
    featured: filters.featured || undefined,
  };
}

export function hasActiveProductFilters(filters: ProductListFilters): boolean {
  return Object.values(productListFilterQuery(filters)).some(Boolean);
}
