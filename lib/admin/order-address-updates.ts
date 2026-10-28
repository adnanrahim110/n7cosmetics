import { z } from "zod";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import type { Administrator } from "../auth/types";
import { writeAuditLog } from "../auth/audit";
import { executeMutation, selectOne } from "../db/query";
import { getShippingConfiguration } from "../commerce/shipping-data";
import { normalizePostcode, shippingOptions } from "../commerce/shipping";
import { enqueueOrderEmails } from "../email/orders";
import type { OrderUpdate, OrderUpdateResult } from "./order-status";
import { normalizedOrderAddress, orderShippingAddress, shippingAddressEditError, type AddressOrderState, type OrderAddressRow } from "./order-address";

export interface AddressUpdateOrder extends AddressOrderState {
  delivery_address_review_required: number;
  shipping_address_revision: number; subtotal_pence: number; discount_pence: number; shipping_pence: number; shipping_snapshot_json: unknown;
}

const shippingSnapshotSchema = z.object({ id: z.string(), adjustment: z.object({ source: z.string(), id: z.string(), name: z.string() }).nullable() });

export async function saveShippingAddress(orderId: string, order: AddressUpdateOrder, update: Extract<OrderUpdate, { kind: "shipping-address" }>, administrator: Pick<Administrator, "id"> | null, ipAddress: string | null, connection: PoolConnection): Promise<OrderUpdateResult> {
  const blocked = shippingAddressEditError(order);
  if (blocked) return { success: false, message: blocked };
  if (order.shipping_address_revision !== update.revision) return { success: false, message: "The delivery address changed in another session. Refresh the order before editing." };
  const current = await selectOne<RowDataPacket & OrderAddressRow>("SELECT * FROM order_addresses WHERE order_id = ? AND address_type = 'SHIPPING' FOR UPDATE", [orderId], connection);
  const address = update.address;
  if (!address.phone && order.source !== "LEGACY") return { success: false, message: "Enter a delivery phone number.", fieldErrors: { "address.phone": ["Enter a delivery phone number."] } };
  const before = current ? orderShippingAddress(current) : null;
  const addressChanged = !before || before.countryCode !== address.countryCode || normalizedOrderAddress({ ...before, countryCode: "GB" }) !== normalizedOrderAddress(address);
  const completingReview = Boolean(order.delivery_address_review_required);
  if (!addressChanged && !completingReview) return { success: true, changed: false };
  if (!before || before.countryCode !== address.countryCode || normalizePostcode(before.postalCode) !== normalizePostcode(address.postalCode)) {
    let snapshot: unknown = order.shipping_snapshot_json;
    if (typeof snapshot === "string") { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
    const stored = shippingSnapshotSchema.safeParse(snapshot);
    if (!stored.success) return { success: false, message: "The original delivery service cannot be verified for a new postcode. Ask a manager to review postage before changing the destination." };
    const config = await getShippingConfiguration(connection);
    const coupon = stored.data.adjustment?.source === "COUPON" ? stored.data.adjustment : null;
    const options = shippingOptions(config, address.countryCode, address.postalCode, order.subtotal_pence, order.subtotal_pence - order.discount_pence, coupon);
    const service = options.find((option) => option.id === stored.data.id);
    if (!service || service.pricePence !== order.shipping_pence) return { success: false, message: "This postcode requires a different delivery service or charge. Ask a manager to resolve postage before changing the destination." };
  }
  await executeMutation(`INSERT INTO order_addresses (order_id, address_type, full_name, company, line_1, line_2, city, region, postal_code, country_code, phone)
    VALUES (?, 'SHIPPING', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), company = VALUES(company), line_1 = VALUES(line_1), line_2 = VALUES(line_2), city = VALUES(city), region = VALUES(region), postal_code = VALUES(postal_code), country_code = VALUES(country_code), phone = VALUES(phone)`,
  [orderId, address.fullName, address.company || null, address.line1, address.line2 || null, address.city, address.region || null, address.postalCode, address.countryCode, address.phone || null], connection);
  await executeMutation("UPDATE orders SET shipping_address_revision = shipping_address_revision + ?, delivery_address_review_required = 0, delivery_address_confirmed_at = IF(?, CURRENT_TIMESTAMP(3), delivery_address_confirmed_at) WHERE id = ?", [Number(addressChanged), completingReview, orderId], connection);
  const note = administrator ? `Delivery address corrected: ${update.reason}` : "Customer confirmed the delivery address after wallet payment";
  const history = await executeMutation("INSERT INTO order_status_history (order_id, administrator_id, status, note) VALUES (?, ?, ?, ?)", [orderId, administrator?.id ?? null, order.status, note], connection);
  await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'Superseded by a newer delivery address correction.' WHERE order_id = ? AND order_email_kind IN ('address', 'team-address') AND status IN ('PENDING', 'FAILED')", [orderId], connection);
  await enqueueOrderEmails(orderId, `${completingReview && !addressChanged ? "update" : "address"}:${history.insertId}`, connection);
  await writeAuditLog({ administratorId: administrator?.id ?? null, action: completingReview ? "ORDER_ADDRESS_CONFIRM" : "ORDER_ADDRESS_UPDATE", entityType: "order", entityId: orderId, summary: completingReview ? "Confirmed order delivery address" : "Corrected order delivery address", metadata: { before, after: address, reason: update.reason, revision: order.shipping_address_revision + Number(addressChanged) }, ipAddress }, connection);
  return { success: true, changed: true };
}
