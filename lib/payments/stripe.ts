import type Stripe from "stripe";
import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { enqueueOrderEmails } from "../email/orders";
import { enqueuePaymentFailureAlert } from "../email/alerts";
import { getStripeSettings, stripeClient, type StripeSettings } from "./settings";

interface StripeOrder extends RowDataPacket {
  id: string; order_number: string; total_pence: number; currency: string; payment_status: string;
  idempotency_key: string; intent_id: string | null; stripe_mode: "test" | "live"; inventory_state: string;
}

export async function ensurePaymentIntent(orderId: string, settings: StripeSettings, stripe = stripeClient(settings)): Promise<Stripe.PaymentIntent> {
  const order = await selectOne<StripeOrder>(`SELECT CAST(o.id AS CHAR) AS id, o.order_number, o.total_pence, o.currency, o.payment_status, p.idempotency_key, c.intent_id, c.stripe_mode, c.inventory_state FROM orders o JOIN stripe_checkouts c ON c.order_id = o.id JOIN payments p ON p.order_id = o.id AND p.provider = 'STRIPE' WHERE o.id = ?`, [orderId]);
  if (!order || order.stripe_mode !== settings.mode) throw new Error("Payment account does not match this checkout.");
  if (order.intent_id) return stripe.paymentIntents.retrieve(order.intent_id);
  if (order.inventory_state === "RELEASED") throw new Error("This checkout has expired.");
  // The same server-side order always uses exactly the same Stripe request/key,
  // including recovery after a network timeout between Stripe and our database.
  const intent = await stripe.paymentIntents.create({
    amount: order.total_pence,
    currency: order.currency.toLowerCase(),
    payment_method_types: ["card"],
    metadata: { n7_order_id: order.id, n7_order_number: order.order_number },
    description: `N7 Cosmetics order ${order.order_number}`,
  }, { idempotencyKey: `n7:${order.idempotency_key}` });
  await withTransaction(async (connection) => {
    await executeMutation("UPDATE stripe_checkouts SET intent_id = ? WHERE order_id = ? AND (intent_id IS NULL OR intent_id = ?)", [intent.id, order.id, intent.id], connection);
    await executeMutation("UPDATE payments SET provider_reference = ? WHERE order_id = ? AND provider = 'STRIPE'", [intent.id, order.id], connection);
    await executeMutation("UPDATE orders SET payment_reference = ? WHERE id = ?", [intent.id, order.id], connection);
  });
  return intent;
}

export function validIntentForOrder(intent: Pick<Stripe.PaymentIntent, "amount" | "amount_received" | "currency" | "livemode" | "status">, order: { total_pence: number; currency: string; stripe_mode: string }): boolean {
  return intent.amount === order.total_pence && intent.currency.toUpperCase() === order.currency
    && intent.livemode === (order.stripe_mode === "live")
    && (intent.status !== "succeeded" || intent.amount_received === order.total_pence);
}

// Called only with a signature-verified webhook or an authenticated Stripe API response.
export type PaymentIntentSnapshot = Pick<Stripe.PaymentIntent, "id" | "metadata" | "amount" | "amount_received" | "currency" | "livemode" | "status"> & Partial<Pick<Stripe.PaymentIntent, "last_payment_error">>;
export async function applyPaymentIntent(intent: PaymentIntentSnapshot, event?: { id: string; type: string }): Promise<void> {
  const orderId = intent.metadata.n7_order_id;
  if (!orderId || !/^[1-9]\d*$/.test(orderId)) return;
  await withTransaction(async (connection) => {
    const order = await selectOne<StripeOrder>(`SELECT CAST(o.id AS CHAR) AS id, o.order_number, o.total_pence, o.currency, o.payment_status, c.intent_id, c.stripe_mode, c.inventory_state FROM orders o JOIN stripe_checkouts c ON c.order_id = o.id WHERE o.id = ? FOR UPDATE`, [orderId], connection);
    if (!order) return;
    if (order.intent_id && order.intent_id !== intent.id) throw new Error("Stripe payment reference mismatch.");
    if (!validIntentForOrder(intent, order)) throw new Error("Stripe payment amount, currency or mode mismatch.");
    if (event) {
      const inserted = await executeMutation("INSERT IGNORE INTO stripe_webhook_events (event_id, event_type) VALUES (?, ?)", [event.id, event.type], connection);
      if (!inserted.affectedRows) return;
    }
    await executeMutation("UPDATE stripe_checkouts SET intent_id = ? WHERE order_id = ?", [intent.id, orderId], connection);
    await executeMutation("UPDATE payments SET provider_reference = ? WHERE order_id = ? AND provider = 'STRIPE'", [intent.id, orderId], connection);
    if (order.inventory_state === "COMMITTED") return; // Never downgrade an already paid/refunded order.
    if (intent.status === "succeeded") {
      if (order.inventory_state === "RELEASED") throw new Error("Received payment for released inventory; manual review required.");
      await executeMutation("UPDATE stripe_checkouts SET inventory_state = 'COMMITTED' WHERE order_id = ?", [orderId], connection);
      await executeMutation("UPDATE orders SET payment_status = 'PAID', status = CASE WHEN status = 'NEW' THEN 'CONFIRMED' ELSE status END, paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP(3)), payment_reference = ? WHERE id = ?", [intent.id, orderId], connection);
      await executeMutation("UPDATE payments SET status = 'SUCCEEDED', processed_at = CURRENT_TIMESTAMP(3) WHERE order_id = ? AND provider = 'STRIPE'", [orderId], connection);
      await executeMutation("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'PAID', 'Payment confirmed by Stripe')", [orderId], connection);
      await enqueueOrderEmails(orderId, "confirmation", connection);
    } else if (intent.status === "canceled" && order.inventory_state === "RESERVED") {
      const reservations = await selectRows<RowDataPacket & { variant_id: string; quantity: number }>("SELECT CAST(variant_id AS CHAR) AS variant_id, quantity FROM checkout_stock_reservations WHERE order_id = ? ORDER BY variant_id", [orderId], connection);
      for (const row of reservations) await executeMutation("UPDATE product_variants SET stock_on_hand = stock_on_hand + ? WHERE id = ?", [row.quantity, row.variant_id], connection);
      const coupon = await selectOne<RowDataPacket & { coupon_id: string }>("SELECT CAST(coupon_id AS CHAR) AS coupon_id FROM coupon_redemptions WHERE order_id = ?", [orderId], connection);
      if (coupon) {
        await executeMutation("UPDATE coupons SET used_count = GREATEST(used_count, 1) - 1 WHERE id = ?", [coupon.coupon_id], connection);
        await executeMutation("DELETE FROM coupon_redemptions WHERE order_id = ?", [orderId], connection);
      }
      await executeMutation("UPDATE stripe_checkouts SET inventory_state = 'RELEASED' WHERE order_id = ?", [orderId], connection);
      await executeMutation("UPDATE orders SET status = 'CANCELLED', payment_status = 'FAILED' WHERE id = ?", [orderId], connection);
      await executeMutation("UPDATE payments SET status = 'CANCELLED', processed_at = CURRENT_TIMESTAMP(3) WHERE order_id = ? AND provider = 'STRIPE'", [orderId], connection);
      await executeMutation("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'CANCELLED', 'Stripe payment cancelled; reserved stock and coupon usage released')", [orderId], connection);
    } else if ((event?.type === "payment_intent.payment_failed" || (intent.status === "requires_payment_method" && intent.last_payment_error)) && order.inventory_state === "RESERVED") {
      if (order.payment_status !== "FAILED") await enqueuePaymentFailureAlert(orderId, connection);
      await executeMutation("UPDATE orders SET payment_status = 'FAILED' WHERE id = ?", [orderId], connection);
      await executeMutation("UPDATE payments SET status = 'FAILED' WHERE order_id = ? AND provider = 'STRIPE'", [orderId], connection);
    } else if (["processing", "requires_action", "requires_confirmation"].includes(intent.status) && order.inventory_state === "RESERVED" && order.payment_status === "FAILED") {
      await executeMutation("UPDATE orders SET payment_status = 'PENDING' WHERE id = ?", [orderId], connection);
      await executeMutation("UPDATE payments SET status = 'PENDING' WHERE order_id = ? AND provider = 'STRIPE'", [orderId], connection);
    }
  });
}

export async function reconcileStripeCheckout(orderId: string, settings: StripeSettings, stripe = stripeClient(settings)): Promise<boolean> {
  // A database lease bounds API calls across browsers, app instances and the worker.
  const claimed = await executeMutation(`UPDATE stripe_checkouts SET reconcile_after = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 180 SECOND)
    WHERE order_id = ? AND inventory_state = 'RESERVED'
      AND (reconcile_after IS NULL OR reconcile_after <= CURRENT_TIMESTAMP(3))`, [orderId]);
  if (!claimed.affectedRows) return false;
  try {
    const checkout = await selectOne<RowDataPacket & { intent_id: string | null; expired: number }>("SELECT intent_id, expires_at <= CURRENT_TIMESTAMP(3) AS expired FROM stripe_checkouts WHERE order_id = ?", [orderId]);
    if (!checkout || (!checkout.intent_id && !checkout.expired)) return false;
    let intent = await ensurePaymentIntent(orderId, settings, stripe);
    if (intent.metadata.n7_order_id !== orderId) throw new Error("Stripe payment order mismatch.");
    // Only cancel abandoned payments after the reservation expires. Processing
    // payments retain their stock, and a paid intent is always committed.
    if (checkout.expired && ["requires_payment_method", "requires_confirmation", "requires_action", "requires_capture"].includes(intent.status)) {
      try { intent = await stripe.paymentIntents.cancel(intent.id, { cancellation_reason: "abandoned" }); }
      catch { intent = await stripe.paymentIntents.retrieve(intent.id); }
    }
    if (intent.metadata.n7_order_id !== orderId) throw new Error("Stripe payment order mismatch.");
    await applyPaymentIntent(intent);
    return true;
  } finally {
    await executeMutation("UPDATE stripe_checkouts SET reconcile_after = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 3 SECOND) WHERE order_id = ?", [orderId]);
  }
}

export async function reconcileStripeCheckouts(limit = 20, client?: Stripe): Promise<number> {
  const rows = await selectRows<RowDataPacket & { order_id: string }>(`SELECT CAST(order_id AS CHAR) AS order_id FROM stripe_checkouts
    WHERE inventory_state = 'RESERVED' AND (intent_id IS NOT NULL OR expires_at <= CURRENT_TIMESTAMP(3))
      AND (reconcile_after IS NULL OR reconcile_after <= CURRENT_TIMESTAMP(3))
    ORDER BY reconcile_after, order_id LIMIT ?`, [limit]);
  if (!rows.length) return 0;
  const settings = await getStripeSettings();
  const stripe = client ?? stripeClient(settings);
  let processed = 0;
  for (const row of rows) {
    try {
      if (await reconcileStripeCheckout(row.order_id, settings, stripe)) processed++;
    } catch { console.error(`Unable to reconcile Stripe checkout ${row.order_id}; will retry.`); }
  }
  return processed;
}
