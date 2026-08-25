export const ADMIN_PRODUCTS_PATH = "/admin/products";

export type ProductListSearchParams = Record<string, string | string[] | undefined>;

export function productListPath(searchParams: ProductListSearchParams): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(name, item);
    } else if (value !== undefined) {
      query.append(name, value);
    }
  }
  const serialized = query.toString();
  return serialized ? `${ADMIN_PRODUCTS_PATH}?${serialized}` : ADMIN_PRODUCTS_PATH;
}

export function productListReturnTo(value: unknown): string {
  if (typeof value !== "string") return ADMIN_PRODUCTS_PATH;
  try {
    const base = new URL("https://admin.n7cosmetics.local");
    const target = new URL(value, base);
    if (target.origin !== base.origin || target.pathname !== ADMIN_PRODUCTS_PATH || target.hash) {
      return ADMIN_PRODUCTS_PATH;
    }
    return `${target.pathname}${target.search}`;
  } catch {
    return ADMIN_PRODUCTS_PATH;
  }
}

export function productListReturnToWithToast(value: unknown, toast: "product-created" | "product-updated"): string {
  const returnTo = productListReturnTo(value);
  const [pathname, serialized = ""] = returnTo.split("?", 2);
  const query = new URLSearchParams(serialized);
  query.set("toast", toast);
  return `${pathname}?${query.toString()}`;
}

export function productFormPath(pathname: string, returnTo: string): string {
  const query = new URLSearchParams({ returnTo });
  return `${pathname}?${query.toString()}`;
}
