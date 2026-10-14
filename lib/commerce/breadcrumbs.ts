import type { StorefrontProduct } from "./catalog";

export interface ProductBreadcrumb {
  name: string;
  href: string;
}

export type BreadcrumbProduct = Pick<
  StorefrontProduct,
  "productType" | "slug" | "name" | "collectionSlug" | "collectionName"
>;

export function productBreadcrumbs(product: BreadcrumbProduct): ProductBreadcrumb[] {
  const items: ProductBreadcrumb[] = [{ name: "Home", href: "/" }];
  if (product.productType === "BUNDLE") {
    items.push({ name: "Bundles", href: "/bundles" });
  } else if (product.collectionSlug && product.collectionName) {
    items.push({ name: product.collectionName, href: `/${product.collectionSlug}` });
  }
  items.push({
    name: product.name,
    href: `/${product.productType === "BUNDLE" ? "bundles" : "products"}/${product.slug}`,
  });
  return items;
}
