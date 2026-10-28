import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { deliveryReviewRequired } from "../commerce/delivery-review";
import { getOrderItems } from "../commerce/order-items";
import { selectOne } from "../db/query";
import { getEmailPreferences } from "./brand";
import { orderEmail, type OrderEmailData, type OrderEmailKind } from "./templates";

interface OrderRow extends RowDataPacket {
  delivery_address_review_required: number;
  source: "LIVE" | "LEGACY";
  order_number: string; customer_name: string; customer_email: string; currency: string; status: string; payment_status: string; fulfillment_status: string;
  payment_provider: string; subtotal_pence: number; discount_pence: number; shipping_pence: number; tax_pence: number; total_pence: number;
  shipping_method_name: string | null; postage_service: string | null; tracking_reference: string | null; tracking_url: string | null;
}
interface AddressRow extends RowDataPacket { full_name: string; company: string | null; line_1: string; line_2: string | null; city: string; region: string | null; postal_code: string; country_code: string }

export async function renderOrderMessage(orderId: string, kind: OrderEmailKind, connection?: PoolConnection) {
  const order = await selectOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [orderId], connection);
  if (!order) throw new Error("Order not found while preparing email.");
  if (order.source === "LEGACY") return null;
  const items = await getOrderItems(orderId, connection);
  const address = await selectOne<AddressRow>("SELECT * FROM order_addresses WHERE order_id = ? AND address_type = 'SHIPPING'", [orderId], connection);
  const brand = await getEmailPreferences(connection);
  let addressReviewUrl: string | undefined;
  if (deliveryReviewRequired(order) && !kind.startsWith("team")) {
    const payment = await selectOne<RowDataPacket & { idempotency_key: string }>("SELECT idempotency_key FROM payments WHERE order_id = ? AND provider = 'STRIPE' LIMIT 1", [orderId], connection);
    if (payment) { const url = new URL("/checkout/confirmation", brand.appUrl); url.searchParams.set("key", payment.idempotency_key); addressReviewUrl = url.href; }
  }
  const data: OrderEmailData = { addressReviewRequired: deliveryReviewRequired(order), addressReviewUrl, number: order.order_number, name: order.customer_name, email: order.customer_email, currency: order.currency, status: order.status, paymentStatus: order.payment_status, fulfillmentStatus: order.fulfillment_status, paymentMethod: order.payment_provider, subtotal: order.subtotal_pence, discount: order.discount_pence, shipping: order.shipping_pence, tax: order.tax_pence, total: order.total_pence, shippingMethod: order.shipping_method_name || undefined, postageService: order.postage_service || undefined, trackingReference: order.tracking_reference || undefined, trackingUrl: order.tracking_url || undefined, bankInstructions: brand.bankInstructions, address: address ? [address.full_name, address.company, address.line_1, address.line_2, address.city, address.region, address.postal_code, address.country_code].filter(Boolean).join("\n") : "No delivery address recorded.", items: items.map((item) => ({ name: item.product_name, productCode: item.product_code, variant: item.variant_title, quantity: item.quantity, unitPrice: item.unit_price_pence, total: item.line_total_pence, imageUrl: item.image_url })) };
  const templateKeys = { confirmation: "order-confirmation", update: "order-status-update", address: "order-address-updated", team: "new-order-team", "team-update": "order-update-team", "team-address": "order-address-team" };
  return { brand, email: { ...orderEmail(brand, data, kind), to: order.customer_email, replyTo: kind.startsWith("team") ? order.customer_email : brand.replyToEmail, templateKey: templateKeys[kind] } };
}
