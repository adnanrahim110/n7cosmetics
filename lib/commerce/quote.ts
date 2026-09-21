import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import type { CartPricingInput, QuoteInput } from "./validation";
import { calculateBuyXGetYPricing } from "./sale-pricing";
import { shippingOptions, type ShippingOption } from "./shipping";
import { getShippingConfiguration } from "./shipping-data";

export type CommerceErrorCode = "CART_CHANGED" | "OUT_OF_STOCK" | "INVALID_COUPON" | "COUPON_LIMIT" | "DELIVERY_UNAVAILABLE" | "CHECKOUT_CHANGED" | "CHECKOUT_EXPIRED";
export class CommerceError extends Error { constructor(public readonly code: CommerceErrorCode, message: string) { super(message); this.name = "CommerceError"; } }

interface ProductRow extends RowDataPacket { product_id: string; variant_id: string; product_type: "STANDARD" | "BUNDLE"; slug: string; product_name: string; variant_title: string; sku: string; price_pence: number; stock_on_hand: number; track_inventory: number; image_url: string | null; category_ids: string | null; collection_ids: string | null }
interface BundleComponentRow extends RowDataPacket { bundle_product_id: string; variant_id: string; product_name: string; quantity: number; stock_on_hand: number; track_inventory: number; product_type: "STANDARD" | "BUNDLE"; product_status: string; variant_status: string }
interface DiscountRow extends RowDataPacket { id: string; name: string; method: "AUTOMATIC" | "COUPON"; discount_type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"; value: number; applies_to: "ALL" | "PRODUCTS" | "CATEGORIES" | "COLLECTIONS"; minimum_subtotal_pence: number | null; maximum_discount_pence: number | null; coupon_id: string | null; coupon_code: string | null; usage_limit: number | null; per_email_limit: number | null; used_count: number; product_ids: string | null; category_ids: string | null; collection_ids: string | null }
interface SaleRow extends RowDataPacket { id: string; name: string; buy_quantity: number; free_quantity: number; product_ids: string | null }
interface CountRow extends RowDataPacket { redemption_count: number }

export interface BundleStockRequirement { variantId: string; name: string; quantity: number; trackInventory: boolean }
export interface QuoteLine { productId: string; variantId: string; productType: "STANDARD" | "BUNDLE"; slug: string; name: string; variantTitle: string; sku: string; image: string | null; unitPricePence: number; quantity: number; subtotalPence: number; discountPence: number; freeQuantity: number; totalPence: number; stockOnHand: number; trackInventory: boolean; categoryIds: string[]; collectionIds: string[]; bundleComponents: BundleStockRequirement[] }
export interface CartPricing {
  lines: QuoteLine[];
  subtotalPence: number;
  discountPence: number;
  freeQuantity: number;
  totalPence: number;
  currency: "GBP";
  discount: { id: string; name: string; couponId: string | null; couponCode: string | null; saleId: string | null; freeShipping: boolean } | null;
}
export interface CheckoutQuote extends CartPricing {
  shippingPence: number;
  taxPence: number;
  shippingMethod: ShippingOption;
  shippingMethods: ShippingOption[];
  shippingEstimated: boolean;
}

interface PromotionCandidate {
  id: string;
  name: string;
  amount: number;
  freeShipping: boolean;
  eligible: QuoteLine[];
  eligibleSubtotal: number;
  allocations: Map<string, number> | null;
  freeUnits: Map<string, number> | null;
  couponId: string | null;
  couponCode: string | null;
  saleId: string | null;
}

const ids = (value: string | null) => value?.split(",").filter(Boolean) ?? [];
function lineEligible(line: QuoteLine, discount: DiscountRow) { if (discount.applies_to === "ALL") return true; const targets = discount.applies_to === "PRODUCTS" ? ids(discount.product_ids) : discount.applies_to === "CATEGORIES" ? ids(discount.category_ids) : ids(discount.collection_ids); const lineValues = discount.applies_to === "PRODUCTS" ? [line.productId] : discount.applies_to === "CATEGORIES" ? line.categoryIds : line.collectionIds; return lineValues.some((id) => targets.includes(id)); }
function discountAmount(discount: DiscountRow, eligibleSubtotal: number) { if (!eligibleSubtotal || discount.discount_type === "FREE_SHIPPING") return 0; let amount = discount.discount_type === "PERCENTAGE" ? Math.floor(eligibleSubtotal * Math.min(discount.value, 100) / 100) : Math.min(discount.value, eligibleSubtotal); if (discount.maximum_discount_pence !== null) amount = Math.min(amount, discount.maximum_discount_pence); return amount; }

export async function calculateCartPricing(input: CartPricingInput, connection?: PoolConnection): Promise<CartPricing> {
  const placeholders = input.items.map(() => "?").join(",");
  const productRows = await selectRows<ProductRow>(`SELECT CAST(p.id AS CHAR) AS product_id, CAST(v.id AS CHAR) AS variant_id, p.product_type, p.slug, p.name AS product_name, v.title AS variant_title, v.sku, v.price_pence, v.stock_on_hand, p.track_inventory, i.url AS image_url, GROUP_CONCAT(DISTINCT pc.category_id) AS category_ids, GROUP_CONCAT(DISTINCT pcl.collection_id) AS collection_ids FROM products p INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE' LEFT JOIN product_images i ON i.id = (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) LEFT JOIN product_categories pc ON pc.product_id = p.id LEFT JOIN product_collections pcl ON pcl.product_id = p.id WHERE p.status = 'ACTIVE' AND p.slug IN (${placeholders}) GROUP BY p.id, v.id, i.url`, input.items.map((item) => item.slug), connection);
  if (productRows.length !== input.items.length) throw new CommerceError("CART_CHANGED", "One or more products are no longer available.");
  const products = new Map(productRows.map((row) => [row.slug, row]));
  const bundleIds = productRows.filter((row) => row.product_type === "BUNDLE").map((row) => row.product_id);
  const bundleRows = bundleIds.length ? await selectRows<BundleComponentRow>(
    `SELECT CAST(bi.bundle_product_id AS CHAR) AS bundle_product_id, CAST(v.id AS CHAR) AS variant_id,
       p.name AS product_name, bi.quantity, v.stock_on_hand, p.track_inventory, p.product_type,
       p.status AS product_status, v.status AS variant_status
     FROM bundle_items bi
     INNER JOIN product_variants v ON v.id = bi.component_variant_id
     INNER JOIN products p ON p.id = v.product_id
     WHERE bi.bundle_product_id IN (${bundleIds.map(() => "?").join(",")})
     ORDER BY bi.bundle_product_id, bi.sort_order, bi.component_variant_id`,
    bundleIds,
    connection,
  ) : [];
  const bundleComponents = new Map<string, BundleComponentRow[]>();
  for (const component of bundleRows) bundleComponents.set(component.bundle_product_id, [...(bundleComponents.get(component.bundle_product_id) ?? []), component]);
  const lines: QuoteLine[] = input.items.map((item) => {
    const row = products.get(item.slug);
    if (!row) throw new CommerceError("CART_CHANGED", "Product not found.");
    if (Boolean(row.track_inventory) && row.stock_on_hand < item.quantity) throw new CommerceError("OUT_OF_STOCK", `${row.product_name} does not have enough stock.`);
    const components = row.product_type === "BUNDLE" ? bundleComponents.get(row.product_id) ?? [] : [];
    if (row.product_type === "BUNDLE" && !components.length) throw new CommerceError("CART_CHANGED", `${row.product_name} is not ready to purchase.`);
    for (const component of components) {
      if (component.product_type !== "STANDARD" || component.product_status !== "ACTIVE" || component.variant_status !== "ACTIVE") throw new CommerceError("CART_CHANGED", `A product in ${row.product_name} is no longer available.`);
      if (Boolean(component.track_inventory) && component.stock_on_hand < component.quantity * item.quantity) throw new CommerceError("OUT_OF_STOCK", `${row.product_name} does not have enough component stock.`);
    }
    const subtotal = row.price_pence * item.quantity;
    return { productId: row.product_id, variantId: row.variant_id, productType: row.product_type, slug: row.slug, name: row.product_name, variantTitle: row.variant_title, sku: row.sku, image: row.image_url, unitPricePence: row.price_pence, quantity: item.quantity, subtotalPence: subtotal, discountPence: 0, freeQuantity: 0, totalPence: subtotal, stockOnHand: row.stock_on_hand, trackInventory: Boolean(row.track_inventory), categoryIds: ids(row.category_ids), collectionIds: ids(row.collection_ids), bundleComponents: components.map((component) => ({ variantId: component.variant_id, name: component.product_name, quantity: component.quantity, trackInventory: Boolean(component.track_inventory) })) };
  });
  const subtotalPence = lines.reduce((sum, line) => sum + line.subtotalPence, 0);
  const discounts = await selectRows<DiscountRow>(`SELECT CAST(d.id AS CHAR) AS id, d.name, d.method, d.discount_type, d.value, d.applies_to, d.minimum_subtotal_pence, d.maximum_discount_pence, CAST(c.id AS CHAR) AS coupon_id, c.code AS coupon_code, c.usage_limit, c.per_email_limit, COALESCE(c.used_count, 0) AS used_count, (SELECT GROUP_CONCAT(product_id) FROM discount_products WHERE discount_id = d.id) AS product_ids, (SELECT GROUP_CONCAT(category_id) FROM discount_categories WHERE discount_id = d.id) AS category_ids, (SELECT GROUP_CONCAT(collection_id) FROM discount_collections WHERE discount_id = d.id) AS collection_ids FROM discounts d LEFT JOIN coupons c ON c.discount_id = d.id AND c.is_active = 1 WHERE d.is_active = 1 AND (d.starts_at IS NULL OR d.starts_at <= CURRENT_TIMESTAMP(3)) AND (d.ends_at IS NULL OR d.ends_at > CURRENT_TIMESTAMP(3)) AND (d.method = 'AUTOMATIC' OR (d.method = 'COUPON' AND c.code = ?)) ORDER BY d.priority DESC, d.id`, [input.couponCode ?? ""], connection);
  const couponRows = discounts.filter((discount) => discount.method === "COUPON");
  if (input.couponCode && !couponRows.length) throw new CommerceError("INVALID_COUPON", "The coupon is invalid or expired.");
  if (input.couponCode && couponRows.some((coupon) => coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)) throw new CommerceError("COUPON_LIMIT", "The coupon usage limit has been reached.");
  if (input.customerEmail) for (const coupon of couponRows) if (coupon.coupon_id && coupon.per_email_limit !== null) { const count = await selectOne<CountRow>("SELECT COUNT(*) AS redemption_count FROM coupon_redemptions WHERE coupon_id = ? AND customer_email = ?", [coupon.coupon_id, input.customerEmail], connection); if (Number(count?.redemption_count ?? 0) >= coupon.per_email_limit) throw new CommerceError("COUPON_LIMIT", "This email has reached the coupon usage limit."); }
  const pool = input.couponCode ? couponRows : discounts.filter((discount) => discount.method === "AUTOMATIC");
  const candidates: PromotionCandidate[] = pool.filter((discount) => discount.minimum_subtotal_pence === null || subtotalPence >= discount.minimum_subtotal_pence).map((discount) => {
    const eligible = lines.filter((line) => lineEligible(line, discount));
    const eligibleSubtotal = eligible.reduce((sum, line) => sum + line.subtotalPence, 0);
    return {
      id: discount.id,
      name: discount.name,
      eligible,
      eligibleSubtotal,
      amount: discountAmount(discount, eligibleSubtotal),
      freeShipping: discount.discount_type === "FREE_SHIPPING" && eligibleSubtotal > 0,
      allocations: null,
      freeUnits: null,
      couponId: discount.coupon_id,
      couponCode: discount.coupon_code,
      saleId: null,
    };
  });
  if (!input.couponCode) {
    const sales = await selectRows<SaleRow>(
      `SELECT CAST(s.id AS CHAR) AS id, s.name, s.buy_quantity, s.free_quantity,
         (SELECT GROUP_CONCAT(sp.product_id) FROM sale_products sp WHERE sp.sale_id = s.id) AS product_ids
       FROM sales s WHERE s.status = 'ACTIVE' ORDER BY s.sort_order, s.id`,
      [],
      connection,
    );
    for (const sale of sales) {
      const productIds = new Set(ids(sale.product_ids));
      const eligible = lines.filter((line) => line.productType === "STANDARD" && productIds.has(line.productId));
      const pricing = calculateBuyXGetYPricing(
        eligible.map((line) => ({ key: line.variantId, quantity: line.quantity, unitPricePence: line.unitPricePence })),
        sale.buy_quantity,
        sale.free_quantity,
      );
      if (!pricing.freeQuantity) continue;
      candidates.push({
        id: sale.id,
        name: sale.name,
        eligible,
        eligibleSubtotal: eligible.reduce((sum, line) => sum + line.subtotalPence, 0),
        amount: pricing.amountPence,
        freeShipping: false,
        allocations: pricing.allocations,
        freeUnits: pricing.freeUnits,
        couponId: null,
        couponCode: null,
        saleId: sale.id,
      });
    }
  }
  const selected = candidates.sort((a, b) => (Number(b.freeShipping) - Number(a.freeShipping)) || b.amount - a.amount)[0] ?? null;
  if (input.couponCode && (!selected || (!selected.amount && !selected.freeShipping))) throw new CommerceError("INVALID_COUPON", "The coupon does not apply to this cart.");
  if (selected && (selected.amount || selected.freeUnits)) {
    if (selected.allocations) {
      for (const line of selected.eligible) {
        const amount = Math.min(line.totalPence, selected.allocations.get(line.variantId) ?? 0);
        line.discountPence = amount;
        line.freeQuantity = selected.freeUnits?.get(line.variantId) ?? 0;
        line.totalPence -= amount;
      }
    } else {
      let remaining = selected.amount;
      selected.eligible.forEach((line, index) => {
        const amount = index === selected.eligible.length - 1 ? remaining : Math.min(remaining, Math.floor(selected.amount * line.subtotalPence / selected.eligibleSubtotal));
        line.discountPence = amount;
        line.totalPence -= amount;
        remaining -= amount;
      });
    }
  }
  const discountPence = lines.reduce((sum, line) => sum + line.discountPence, 0);
  return {
    lines, subtotalPence, discountPence,
    freeQuantity: lines.reduce((sum, line) => sum + line.freeQuantity, 0),
    totalPence: subtotalPence - discountPence,
    currency: "GBP",
    discount: selected ? {
      id: selected.id, name: selected.name, couponId: selected.couponId,
      couponCode: selected.couponCode, saleId: selected.saleId, freeShipping: selected.freeShipping,
    } : null,
  };
}

export async function calculateQuote(input: QuoteInput, connection?: PoolConnection): Promise<CheckoutQuote> {
  const pricing = await calculateCartPricing(input, connection);
  const config = await getShippingConfiguration(connection);
  const coupon = pricing.discount?.freeShipping ? { id: pricing.discount.id, name: pricing.discount.name } : null;
  const available = shippingOptions(config, input.countryCode, input.postalCode ?? "", pricing.subtotalPence, pricing.totalPence, coupon);
  if (!available.length) throw new CommerceError("DELIVERY_UNAVAILABLE", "Delivery is unavailable for this address. Check your postcode or contact us.");
  const chosen = input.shippingMethodId ? available.find((method) => method.id === input.shippingMethodId) : available[0];
  if (!chosen) throw new CommerceError("DELIVERY_UNAVAILABLE", "The shipment option is unavailable.");
  const shippingPence = chosen.pricePence;
  const taxPence = 0;
  return {
    ...pricing, shippingPence, taxPence, totalPence: pricing.totalPence + shippingPence + taxPence,
    shippingMethod: chosen,
    shippingMethods: available,
    shippingEstimated: !input.postalCode && config.zones.some(zone => zone.isActive && zone.countries.includes(input.countryCode) && zone.postcodes.length > 0),
  };
}
