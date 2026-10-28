"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, nullableFormString } from "@/lib/admin/form";
import { saveOrderUpdate } from "@/lib/admin/order-updates";
import type { OrderUpdate, OrderUpdateResult } from "@/lib/admin/order-status";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { kickEmailQueue } from "@/lib/email/kick";
import { isDatabaseId } from "@/lib/admin/form";
import { selectOne } from "@/lib/db/query";
import type { RowDataPacket } from "mysql2/promise";
import { addressLines, orderShippingAddress, type DispatchDestination, type OrderAddressRow } from "@/lib/admin/order-address";

export async function readDispatchDestinationAction(orderId: string): Promise<DispatchDestination> {
  await requireAdministrator(["OWNER", "MANAGER", "FULFILLMENT"]);
  if (!isDatabaseId(orderId)) return { success: false, message: "Order not found." };
  const row = await selectOne<RowDataPacket & OrderAddressRow & { shipping_address_revision: number; delivery_address_review_required: number }>("SELECT a.*, o.shipping_address_revision, o.delivery_address_review_required FROM orders o JOIN order_addresses a ON a.order_id = o.id AND a.address_type = 'SHIPPING' WHERE o.id = ?", [orderId]);
  if (row?.delivery_address_review_required) return { success: false, message: "The customer must confirm the wallet delivery address before dispatch. You can also confirm a customer-requested correction on order details." };
  return row ? { success: true, revision: row.shipping_address_revision, address: addressLines(orderShippingAddress(row)) } : { success: false, message: "No delivery address is recorded. Correct the shipping address before dispatch." };
}

export async function saveOrderUpdateAction(orderId: string, update: OrderUpdate): Promise<OrderUpdateResult> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER", "FULFILLMENT"]);
  const metadata = await getRequestMetadata();
  const result = await saveOrderUpdate(orderId, update, administrator, metadata.ipAddress);
  if (result.success) {
    if (result.changed) kickEmailQueue();
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }
  return result;
}

export async function updateOrderAction(orderId: string, formData: FormData): Promise<void> {
  const result = await saveOrderUpdateAction(orderId, {
    kind: "details",
    paymentStatus: formString(formData, "paymentStatus") as Extract<OrderUpdate, { kind: "details" }>["paymentStatus"],
    fulfillmentStatus: formString(formData, "fulfillmentStatus") as Extract<OrderUpdate, { kind: "details" }>["fulfillmentStatus"],
    adminNotes: nullableFormString(formData, "adminNotes"),
    historyNote: nullableFormString(formData, "historyNote"),
  });
  redirect(`/admin/orders/${orderId}?${result.success ? "saved=1" : "error=invalid"}`);
}
