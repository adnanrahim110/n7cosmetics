import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { calculateQuote, CommerceError } from "./quote";
import type { CheckoutInput } from "./validation";

interface ExistingOrderRow extends RowDataPacket { order_number: string; total_pence: number; currency: string }
interface CountRow extends RowDataPacket { redemption_count: number }

function orderNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `N7-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function findIdempotentOrder(key: string): Promise<ExistingOrderRow | null> {
  return selectOne<ExistingOrderRow>(`SELECT o.order_number, o.total_pence, o.currency FROM payments p INNER JOIN orders o ON o.id = p.order_id WHERE p.idempotency_key = ? LIMIT 1`, [key]);
}

export async function createOrder(input: CheckoutInput): Promise<ExistingOrderRow> {
  const existing = await findIdempotentOrder(input.idempotencyKey);
  if (existing) return existing;

  try {
    return await withTransaction(async (connection) => {
      const quote = await calculateQuote({ items: input.items, countryCode: input.countryCode, shippingMethodId: input.shippingMethodId, couponCode: input.couponCode, customerEmail: input.customer.email }, connection);

      if (quote.discount?.couponId) {
        await selectOne<RowDataPacket>("SELECT id FROM coupons WHERE id = ? FOR UPDATE", [quote.discount.couponId], connection);
        const limit = await selectOne<CountRow>("SELECT COUNT(*) AS redemption_count FROM coupon_redemptions WHERE coupon_id = ? AND customer_email = ?", [quote.discount.couponId, input.customer.email], connection);
        const coupon = await selectOne<RowDataPacket & { per_email_limit: number | null }>("SELECT per_email_limit FROM coupons WHERE id = ?", [quote.discount.couponId], connection);
        if (coupon?.per_email_limit !== null && Number(limit?.redemption_count ?? 0) >= Number(coupon?.per_email_limit)) throw new CommerceError("COUPON_LIMIT", "This email has reached the coupon usage limit.");
      }

      for (const line of quote.lines) {
        if (!line.trackInventory) continue;
        const stock = await executeMutation("UPDATE product_variants SET stock_on_hand = stock_on_hand - ? WHERE id = ? AND stock_on_hand >= ?", [line.quantity, line.variantId, line.quantity], connection);
        if (stock.affectedRows !== 1) throw new CommerceError("OUT_OF_STOCK", `${line.name} no longer has enough stock.`);
      }

      const number = orderNumber();
      const orderResult = await executeMutation(`INSERT INTO orders (order_number, status, payment_status, fulfillment_status, currency, customer_email, customer_name, customer_phone, subtotal_pence, discount_pence, shipping_pence, tax_pence, total_pence, coupon_code, customer_notes, payment_provider) VALUES (?, 'NEW', 'UNPAID', 'UNFULFILLED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [number, quote.currency, input.customer.email, input.customer.name, input.customer.phone ?? null, quote.subtotalPence, quote.discountPence, quote.shippingPence, quote.taxPence, quote.totalPence, quote.discount?.couponCode ?? null, input.customer.notes ?? null, input.paymentMethod], connection);
      const orderId = String(orderResult.insertId);
      const address = input.shippingAddress;
      for (const type of ["SHIPPING", "BILLING"] as const) await executeMutation(`INSERT INTO order_addresses (order_id, address_type, full_name, company, line_1, line_2, city, region, postal_code, country_code, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, type, address.fullName, address.company ?? null, address.line1, address.line2 ?? null, address.city, address.region ?? null, address.postalCode, address.countryCode, address.phone ?? input.customer.phone ?? null], connection);
      for (const line of quote.lines) await executeMutation(`INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_title, sku, image_url, unit_price_pence, quantity, discount_pence, line_total_pence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, line.productId, line.variantId, line.name, line.variantTitle, line.sku, line.image, line.unitPricePence, line.quantity, line.discountPence, line.totalPence], connection);
      await executeMutation(`INSERT INTO payments (order_id, provider, payment_type, status, amount_pence, currency, idempotency_key) VALUES (?, ?, 'CHARGE', 'PENDING', ?, ?, ?)`, [orderId, input.paymentMethod, quote.totalPence, quote.currency, input.idempotencyKey], connection);
      await executeMutation("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'NEW', 'Order placed through storefront checkout')", [orderId], connection);

      if (quote.discount?.couponId) {
        const updated = await executeMutation("UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)", [quote.discount.couponId], connection);
        if (updated.affectedRows !== 1) throw new CommerceError("COUPON_LIMIT", "The coupon usage limit has been reached.");
        await executeMutation("INSERT INTO coupon_redemptions (coupon_id, order_id, customer_email, discount_pence) VALUES (?, ?, ?, ?)", [quote.discount.couponId, orderId, input.customer.email, quote.discountPence], connection);
      }

      return { order_number: number, total_pence: quote.totalPence, currency: quote.currency } as ExistingOrderRow;
    });
  } catch (error: unknown) {
    const duplicate = error as { code?: string };
    if (duplicate.code === "ER_DUP_ENTRY") {
      const racedOrder = await findIdempotentOrder(input.idempotencyKey);
      if (racedOrder) return racedOrder;
    }
    throw error;
  }
}
