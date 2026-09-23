import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { calculateQuote, CommerceError } from "./quote";
import type { CheckoutInput } from "./validation";
import { saveCheckoutCustomer } from "./customers";
import { getStripeSettings, PaymentUnavailableError } from "../payments/settings";
import { saveCheckoutMarketingPreference } from "../email/newsletter";

export interface ExistingOrderRow extends RowDataPacket { id: string; order_number: string; total_pence: number; currency: string; request_hash: string; expired: number; inventory_state: string }
interface CountRow extends RowDataPacket { redemption_count: number }

async function orderNumber(connection: PoolConnection): Promise<string> {
  // The row lock and increment belong to the checkout transaction, so concurrent
  // checkouts get distinct numbers and a rolled-back order does not consume one.
  const sequence = await selectOne<RowDataPacket & { next_number: string }>("SELECT CAST(next_number AS CHAR) AS next_number FROM order_number_sequence WHERE id = 1 FOR UPDATE", [], connection);
  if (!sequence) throw new Error("Order numbering is not configured. Run the database migrations.");
  await executeMutation("UPDATE order_number_sequence SET next_number = next_number + 1 WHERE id = 1", [], connection);
  return `N7-${sequence.next_number}`;
}

async function findIdempotentOrder(key: string): Promise<ExistingOrderRow | null> {
  return selectOne<ExistingOrderRow>(`SELECT CAST(o.id AS CHAR) AS id, o.order_number, o.total_pence, o.currency, c.request_hash, c.inventory_state, c.expires_at <= CURRENT_TIMESTAMP(3) AS expired FROM payments p INNER JOIN orders o ON o.id = p.order_id INNER JOIN stripe_checkouts c ON c.order_id = o.id WHERE p.idempotency_key = ? LIMIT 1`, [key]);
}

export async function createOrder(input: CheckoutInput, mode: "test" | "live", settingsRevision?: string): Promise<ExistingOrderRow> {
  const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const checkExisting = (order: ExistingOrderRow) => {
    if (order.request_hash !== requestHash) throw new CommerceError("CHECKOUT_CHANGED", "Checkout details changed. Please try again.");
    if (order.inventory_state === "RELEASED" || (order.expired && order.inventory_state !== "COMMITTED")) throw new CommerceError("CHECKOUT_EXPIRED", "This payment session expired. Please try again.");
    return order;
  };
  const existing = await findIdempotentOrder(input.idempotencyKey);
  if (existing) return checkExisting(existing);

  try {
    return await withTransaction(async (connection) => {
      if (settingsRevision) {
        await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'stripe.enabled' FOR UPDATE", [], connection);
        const currentSettings = await getStripeSettings(connection);
        if (!currentSettings.enabled || currentSettings.revision !== settingsRevision) throw new PaymentUnavailableError();
      }
      const quote = await calculateQuote({ items: input.items, countryCode: input.shippingAddress.countryCode, postalCode: input.shippingAddress.postalCode, shippingMethodId: input.shippingMethodId, couponCode: input.couponCode, customerEmail: input.customer.email }, connection);
      if (quote.totalPence !== input.expectedTotalPence) throw new CommerceError("CART_CHANGED", "The order total changed. Refresh checkout before paying.");

      if (quote.discount?.couponId) {
        await selectOne<RowDataPacket>("SELECT id FROM coupons WHERE id = ? FOR UPDATE", [quote.discount.couponId], connection);
        const limit = await selectOne<CountRow>("SELECT COUNT(*) AS redemption_count FROM coupon_redemptions WHERE coupon_id = ? AND customer_email = ?", [quote.discount.couponId, input.customer.email], connection);
        const coupon = await selectOne<RowDataPacket & { per_email_limit: number | null }>("SELECT per_email_limit FROM coupons WHERE id = ?", [quote.discount.couponId], connection);
        if (coupon?.per_email_limit !== null && Number(limit?.redemption_count ?? 0) >= Number(coupon?.per_email_limit)) throw new CommerceError("COUPON_LIMIT", "This email has reached the coupon usage limit.");
      }

      const reservations = new Map<string, number>();
      for (const line of quote.lines) {
        if (line.trackInventory) reservations.set(line.variantId, (reservations.get(line.variantId) ?? 0) + line.quantity);
        for (const component of line.bundleComponents) {
          if (!component.trackInventory) continue;
          const required = component.quantity * line.quantity;
          reservations.set(component.variantId, (reservations.get(component.variantId) ?? 0) + required);
        }
      }
      for (const [variantId, quantity] of [...reservations].sort(([a], [b]) => a.localeCompare(b))) {
        const stock = await executeMutation("UPDATE product_variants SET stock_on_hand = stock_on_hand - ? WHERE id = ? AND stock_on_hand >= ?", [quantity, variantId, quantity], connection);
        if (stock.affectedRows !== 1) throw new CommerceError("OUT_OF_STOCK", "An item no longer has enough stock. Please review your cart.");
      }

      const number = await orderNumber(connection);
      const customerId = await saveCheckoutCustomer({ ...input.customer, name: input.billingAddress.fullName, countryCode: input.billingAddress.countryCode }, connection);
      const orderResult = await executeMutation(`INSERT INTO orders (order_number, status, payment_status, fulfillment_status, currency, customer_email, customer_name, customer_phone, subtotal_pence, discount_pence, shipping_pence, tax_pence, total_pence, coupon_code, customer_notes, payment_provider) VALUES (?, 'NEW', 'PENDING', 'UNFULFILLED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [number, quote.currency, input.customer.email, input.billingAddress.fullName, input.customer.phone, quote.subtotalPence, quote.discountPence, quote.shippingPence, quote.taxPence, quote.totalPence, quote.discount?.couponCode ?? null, input.customer.notes ?? null, input.paymentMethod], connection);
      const orderId = String(orderResult.insertId);
      await executeMutation("UPDATE orders SET shipping_method_name = ?, shipping_snapshot_json = ?, customer_id = ? WHERE id = ?", [quote.shippingMethod.name, JSON.stringify(quote.shippingMethod), customerId, orderId], connection);
      for (const type of ["SHIPPING", "BILLING"] as const) {
        const address = type === "BILLING" ? input.billingAddress : input.shippingAddress;
        await executeMutation(`INSERT INTO order_addresses (order_id, address_type, full_name, company, line_1, line_2, city, region, postal_code, country_code, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, type, address.fullName, address.company ?? null, address.line1, address.line2 ?? null, address.city, address.region ?? null, address.postalCode, address.countryCode, address.phone], connection);
      }
      for (const line of quote.lines) await executeMutation(`INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_title, sku, image_url, unit_price_pence, quantity, discount_pence, line_total_pence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, line.productId, line.variantId, line.name, line.variantTitle, line.sku, line.image, line.unitPricePence, line.quantity, line.discountPence, line.totalPence], connection);
      await executeMutation(`INSERT INTO payments (order_id, provider, payment_type, status, amount_pence, currency, idempotency_key) VALUES (?, ?, 'CHARGE', 'PENDING', ?, ?, ?)`, [orderId, input.paymentMethod, quote.totalPence, quote.currency, input.idempotencyKey], connection);
      await executeMutation("INSERT INTO stripe_checkouts (order_id, request_hash, stripe_mode, expires_at) VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE))", [orderId, requestHash, mode], connection);
      for (const [variantId, quantity] of reservations) await executeMutation("INSERT INTO checkout_stock_reservations (order_id, variant_id, quantity) VALUES (?, ?, ?)", [orderId, variantId, quantity], connection);
      await executeMutation("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'NEW', 'Awaiting Stripe payment; stock reserved for 30 minutes')", [orderId], connection);

      if (quote.discount?.couponId) {
        const updated = await executeMutation("UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)", [quote.discount.couponId], connection);
        if (updated.affectedRows !== 1) throw new CommerceError("COUPON_LIMIT", "The coupon usage limit has been reached.");
        await executeMutation("INSERT INTO coupon_redemptions (coupon_id, order_id, customer_email, discount_pence) VALUES (?, ?, ?, ?)", [quote.discount.couponId, orderId, input.customer.email, quote.discountPence], connection);
      }

      await saveCheckoutMarketingPreference(orderId, input.customer.email, input.marketingOptOut, connection);

      return { id: orderId, order_number: number, total_pence: quote.totalPence, currency: quote.currency, request_hash: requestHash, expired: 0, inventory_state: "RESERVED" } as ExistingOrderRow;
    });
  } catch (error: unknown) {
    const duplicate = error as { code?: string };
    if (duplicate.code === "ER_DUP_ENTRY") {
      const racedOrder = await findIdempotentOrder(input.idempotencyKey);
      if (racedOrder) return checkExisting(racedOrder);
    }
    throw error;
  }
}
