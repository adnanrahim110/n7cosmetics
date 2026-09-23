"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, nullableFormString } from "@/lib/admin/form";
import { saveOrderUpdate } from "@/lib/admin/order-updates";
import type { OrderUpdate, OrderUpdateResult } from "@/lib/admin/order-status";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { kickEmailQueue } from "@/lib/email/kick";

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
