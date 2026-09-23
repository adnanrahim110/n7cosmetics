import { MAX_CART_ITEM_QUANTITY } from "./cart-limits";

export interface StockComponent {
  variantId: string;
  name: string;
  quantity: number;
  stockOnHand: number;
  trackInventory: boolean;
  available: boolean;
}

export interface StockProduct {
  slug: string;
  name: string;
  variantId: string;
  productType: "STANDARD" | "BUNDLE";
  stockOnHand: number;
  trackInventory: boolean;
  components: StockComponent[];
}

export interface StockAvailability {
  availableQuantity: number | null;
  maxQuantity: number;
  soldOut: boolean;
}
export interface StockItem { slug: string; quantity: number }
export interface StockIssue { slug: string; code: "OUT_OF_STOCK" | "CART_CHANGED"; message: string }
export interface StockSnapshot {
  products: Record<string, StockAvailability>;
  limits: Record<string, number>;
  issues: StockIssue[];
}
export const unavailableStock: StockAvailability = { availableQuantity: 0, maxQuantity: 0, soldOut: true };

// Both individual products and bundles consume variants. Aggregate repeated
// components before calculating capacity, including stock shared across cart lines.
export function stockRequirements(product: StockProduct): Map<string, { units: number; stock: number }> {
  const requirements = new Map<string, { units: number; stock: number }>();
  const add = (id: string, units: number, stock: number) => {
    const existing = requirements.get(id);
    requirements.set(id, { units: (existing?.units ?? 0) + units, stock: Math.min(existing?.stock ?? Infinity, Math.max(0, stock)) });
  };
  if (product.trackInventory) add(product.variantId, 1, product.stockOnHand);
  if (product.productType === "BUNDLE") {
    for (const component of product.components) {
      if (component.trackInventory) add(component.variantId, component.quantity, component.stockOnHand);
    }
  }
  return requirements;
}

export function stockAvailability(product: StockProduct | undefined): StockAvailability {
  if (!product || (product.productType === "BUNDLE" && (!product.components.length || product.components.some((component) => !component.available || component.quantity < 1)))) return unavailableStock;
  const requirements = stockRequirements(product);
  const availableQuantity = requirements.size ? Math.min(...[...requirements.values()].map(({ units, stock }) => Math.floor(stock / units))) : null;
  const maxQuantity = Math.min(MAX_CART_ITEM_QUANTITY, availableQuantity ?? MAX_CART_ITEM_QUANTITY);
  return { availableQuantity, maxQuantity, soldOut: maxQuantity === 0 };
}

export function inspectStock(products: StockProduct[], items: readonly StockItem[] = []): StockSnapshot {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.slug, (quantities.get(item.slug) ?? 0) + item.quantity);
  const used = new Map<string, number>();
  for (const [slug, quantity] of quantities) {
    const product = bySlug.get(slug);
    if (!product) continue;
    for (const [id, { units }] of stockRequirements(product)) used.set(id, (used.get(id) ?? 0) + units * quantity);
  }
  const snapshot: StockSnapshot = { products: {}, limits: {}, issues: [] };
  for (const product of products) {
    const availability = stockAvailability(product);
    snapshot.products[product.slug] = availability;
    let maximum = availability.maxQuantity;
    for (const [id, { units, stock }] of stockRequirements(product)) {
      const usedByOthers = (used.get(id) ?? 0) - (quantities.get(product.slug) ?? 0) * units;
      maximum = Math.min(maximum, Math.max(0, Math.floor((stock - usedByOthers) / units)));
    }
    snapshot.limits[product.slug] = maximum;
  }
  for (const [slug, quantity] of quantities) {
    const product = bySlug.get(slug);
    if (!product) snapshot.issues.push({ slug, code: "CART_CHANGED", message: "An item in your cart is no longer available. Please remove it." });
    else if (quantity > snapshot.limits[slug]) {
      const maximum = snapshot.limits[slug];
      snapshot.issues.push({ slug, code: "OUT_OF_STOCK", message: snapshot.products[slug].soldOut
        ? `${product.name} is sold out.`
        : maximum > 0 ? `Only ${maximum} of ${product.name} can be added with your current selection.`
          : `${product.name} shares stock with another item in your cart. Reduce the quantity or remove an item.` });
    }
  }
  return snapshot;
}
