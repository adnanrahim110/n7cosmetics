import { z } from "zod";
import { checkoutAddressSchema, checkoutPhoneSchema } from "../commerce/checkout-validation";

export const orderShippingAddressSchema = checkoutAddressSchema.extend({
  phone: checkoutPhoneSchema.or(z.literal("")),
});
export type OrderShippingAddress = z.infer<typeof orderShippingAddressSchema>;

export interface OrderAddressRow {
  full_name: string; company: string | null; line_1: string; line_2: string | null;
  city: string; region: string | null; postal_code: string; country_code: string; phone: string | null;
}

export function orderShippingAddress(row: OrderAddressRow) {
  return { fullName: row.full_name, company: row.company ?? "", line1: row.line_1, line2: row.line_2 ?? "", city: row.city, region: row.region ?? "", postalCode: row.postal_code, countryCode: row.country_code, phone: row.phone ?? "" };
}

export type OrderAddressDetails = ReturnType<typeof orderShippingAddress>;

export function addressLines(address: ReturnType<typeof orderShippingAddress>): string {
  return [address.fullName, address.company, address.line1, address.line2, address.city, address.region, address.postalCode, address.countryCode, address.phone].filter(Boolean).join("\n");
}

export function normalizedOrderAddress(address: OrderShippingAddress): string {
  return JSON.stringify([address.fullName, address.company ?? "", address.line1, address.line2 ?? "", address.city, address.region ?? "", address.postalCode.replace(/\s/g, "").toUpperCase(), address.countryCode, address.phone]);
}

export interface AddressOrderState {
  source: string; status: string; payment_status: string; fulfillment_status: string; tracking_reference: string | null;
}

export type DispatchDestination = { success: true; revision: number; address: string } | { success: false; message: string };

export function shippingAddressEditError(order: AddressOrderState): string | null {
  if (order.tracking_reference || order.fulfillment_status !== "UNFULFILLED" || ["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status)) return "This order has been dispatched or fulfilled. Contact the courier to resolve its delivery address.";
  if (!["NEW", "CONFIRMED", "PROCESSING", "ON_HOLD"].includes(order.status)) return "The delivery address cannot be changed for this order status.";
  if (order.source !== "LEGACY" && order.payment_status !== "PAID") return "Wait for payment to complete before correcting the delivery address.";
  return null;
}
