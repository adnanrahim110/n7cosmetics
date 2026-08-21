"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { formString, isDatabaseId, nullableFormString } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { sendProjectEmail } from "@/lib/email/service";

const schema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  paymentStatus: z.enum(["UNPAID", "PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"]),
  fulfillmentStatus: z.enum(["UNFULFILLED", "PARTIAL", "FULFILLED", "RETURNED"]),
  adminNotes: z.string().max(10000).nullable(), historyNote: z.string().max(500).nullable(),
});

interface CurrentOrderState extends RowDataPacket {
  payment_status: "UNPAID" | "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";
  status: "NEW" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  customer_email: string;
  order_number: string;
}

export async function updateOrderAction(orderId: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER", "FULFILLMENT"]);
  if (!isDatabaseId(orderId)) redirect("/admin/orders");
  const parsed = schema.safeParse({ status: formString(formData, "status"), paymentStatus: formString(formData, "paymentStatus"), fulfillmentStatus: formString(formData, "fulfillmentStatus"), adminNotes: nullableFormString(formData, "adminNotes"), historyNote: nullableFormString(formData, "historyNote") });
  if (!parsed.success) redirect(`/admin/orders/${orderId}?error=invalid`);
  const order = parsed.data;
  const current = await selectOne<CurrentOrderState>("SELECT payment_status, status, customer_email, order_number FROM orders WHERE id = ?", [orderId]);
  if (!current) redirect("/admin/orders");
  if (administrator.role === "FULFILLMENT" && ["CANCELLED", "REFUNDED"].includes(order.status)) {
    redirect(`/admin/orders/${orderId}?error=denied`);
  }
  const paymentStatus = administrator.role === "FULFILLMENT" ? current.payment_status : order.paymentStatus;
  await withTransaction(async (connection) => {
    await executeMutation(`UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ?, admin_notes = ?, paid_at = CASE WHEN ? = 'PAID' THEN COALESCE(paid_at, CURRENT_TIMESTAMP(3)) ELSE paid_at END WHERE id = ?`, [order.status, paymentStatus, order.fulfillmentStatus, order.adminNotes, paymentStatus, orderId], connection);
    await executeMutation("INSERT INTO order_status_history (order_id, administrator_id, status, note) VALUES (?, ?, ?, ?)", [orderId, administrator.id, order.status, order.historyNote], connection);
  });
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: administrator.id, action: "ORDER_UPDATE", entityType: "order", entityId: orderId, summary: `Updated order to ${order.status}`, metadata: { paymentStatus, fulfillmentStatus: order.fulfillmentStatus }, ipAddress: metadata.ipAddress });
  if (current.status !== order.status) after(async () => { const readableStatus = order.status.toLowerCase().replaceAll("_", " "); await sendProjectEmail({ to: current.customer_email, subject: `Order ${current.order_number} is ${readableStatus}`, text: `Your N7 Cosmetics order ${current.order_number} is now ${readableStatus}.`, html: `<p>Your N7 Cosmetics order <strong>${current.order_number}</strong> is now <strong>${readableStatus}</strong>.</p>`, templateKey: "order-status-update" }); });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`); redirect(`/admin/orders/${orderId}?saved=1`);
}
