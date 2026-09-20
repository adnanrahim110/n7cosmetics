import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import { getEmailPreferences } from "./brand";
import { enqueueEmail } from "./queue";
import { orderEmail, type OrderEmailData } from "./templates";

interface OrderRow extends RowDataPacket {
  source: "LIVE" | "LEGACY";
  order_number: string; customer_name: string; customer_email: string; currency: string; status: string; payment_status: string; fulfillment_status: string;
  payment_provider: string; subtotal_pence: number; discount_pence: number; shipping_pence: number; tax_pence: number; total_pence: number;
  shipping_method_name: string | null; tracking_reference: string | null; tracking_url: string | null;
}
interface ItemRow extends RowDataPacket { product_name: string; variant_title: string; quantity: number; unit_price_pence: number; line_total_pence: number }
interface AddressRow extends RowDataPacket { full_name: string; company: string | null; line_1: string; line_2: string | null; city: string; region: string | null; postal_code: string; country_code: string }

export async function enqueueOrderEmails(orderId: string, event: "confirmation" | string, connection: PoolConnection): Promise<void> {
  const order = await selectOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [orderId], connection);
  if (!order) throw new Error("Order not found while preparing email.");
  if (order.source === "LEGACY") return;
  const items = await selectRows<ItemRow>("SELECT product_name, variant_title, quantity, unit_price_pence, line_total_pence FROM order_items WHERE order_id = ? ORDER BY id", [orderId], connection);
  const address = await selectOne<AddressRow>("SELECT * FROM order_addresses WHERE order_id = ? AND address_type = 'SHIPPING'", [orderId], connection);
  const brand = await getEmailPreferences(connection);
  const data: OrderEmailData = { number: order.order_number, name: order.customer_name, email: order.customer_email, currency: order.currency, status: order.status, paymentStatus: order.payment_status, fulfillmentStatus: order.fulfillment_status, paymentMethod: order.payment_provider, subtotal: order.subtotal_pence, discount: order.discount_pence, shipping: order.shipping_pence, tax: order.tax_pence, total: order.total_pence, shippingMethod: order.shipping_method_name || undefined, trackingReference: order.tracking_reference || undefined, trackingUrl: order.tracking_url || undefined, bankInstructions: brand.bankInstructions, address: address ? [address.full_name, address.company, address.line_1, address.line_2, address.city, address.region, address.postal_code, address.country_code].filter(Boolean).join("\n") : "No delivery address recorded.", items: items.map((item) => ({ name: item.product_name, variant: item.variant_title, quantity: item.quantity, unitPrice: item.unit_price_pence, total: item.line_total_pence })) };
  const kind = event === "confirmation" ? "confirmation" : "update";
  await enqueueEmail({ ...orderEmail(brand, data, kind), to: order.customer_email, replyTo: brand.contactEmail, templateKey: kind === "confirmation" ? "order-confirmation" : "order-status-update" }, { dedupeKey: `order:${orderId}:${event}:customer` }, connection);
  if (kind === "confirmation" && brand.orderRecipient) {
    await enqueueEmail({ ...orderEmail(brand, data, "team"), to: brand.orderRecipient, replyTo: order.customer_email, templateKey: "new-order-team" }, { dedupeKey: `order:${orderId}:confirmation:team` }, connection);
  }
}
