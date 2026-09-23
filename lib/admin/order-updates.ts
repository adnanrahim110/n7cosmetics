import type { RowDataPacket } from "mysql2/promise";
import type { Administrator } from "../auth/types";
import { writeAuditLog } from "../auth/audit";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { enqueueOrderEmails } from "../email/orders";
import { isDatabaseId } from "./form";
import { orderUpdateSchema, royalMailTrackingUrl, type OrderStatus, type OrderUpdateResult } from "./order-status";

interface CurrentOrder extends RowDataPacket {
  status: OrderStatus;
  payment_provider: string | null;
  payment_status: string;
  fulfillment_status: string;
  admin_notes: string | null;
  postage_service: string | null;
  tracking_reference: string | null;
  tracking_url: string | null;
}

export async function saveOrderUpdate(orderId: string, input: unknown, administrator: Pick<Administrator, "id" | "role">, ipAddress: string | null): Promise<OrderUpdateResult> {
  if (!isDatabaseId(orderId)) return { success: false, message: "Order not found." };
  if (!["OWNER", "MANAGER", "FULFILLMENT"].includes(administrator.role)) return { success: false, message: "You cannot update orders." };
  const parsed = orderUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) (fieldErrors[String(issue.path[0])] ??= []).push(issue.message);
    return { success: false, message: "Check the order details and try again.", fieldErrors };
  }
  const update = parsed.data;
  if (update.kind === "status" && update.status === "SHIPPED") return { success: false, message: "Enter the postage service and tracking number to mark this order shipped." };
  if (update.kind === "status" && administrator.role === "FULFILLMENT" && ["CANCELLED", "REFUNDED"].includes(update.status)) return { success: false, message: "Only an owner or manager can cancel or refund an order." };

  return withTransaction(async (connection) => {
    const current = await selectOne<CurrentOrder>("SELECT status, payment_provider, payment_status, fulfillment_status, admin_notes, postage_service, tracking_reference, tracking_url FROM orders WHERE id = ? FOR UPDATE", [orderId], connection);
    if (!current) return { success: false, message: "Order not found." };
    const next = { ...current };
    let note: string | null = null;
    if (update.kind === "status") next.status = update.status;
    if (update.kind === "tracking") {
      next.status = "SHIPPED";
      next.fulfillment_status = "FULFILLED";
      next.postage_service = update.postageService;
      next.tracking_reference = update.trackingReference;
      next.tracking_url = royalMailTrackingUrl;
      note = `Royal Mail · ${update.postageService} · ${update.trackingReference}`;
    }
    if (update.kind === "details") {
      if (administrator.role !== "FULFILLMENT" && current.payment_provider !== "STRIPE") next.payment_status = update.paymentStatus;
      next.fulfillment_status = update.fulfillmentStatus;
      next.admin_notes = update.adminNotes;
      note = update.historyNote;
    }
    const notifyCustomer = current.status !== next.status || current.payment_status !== next.payment_status || current.fulfillment_status !== next.fulfillment_status || current.postage_service !== next.postage_service || current.tracking_reference !== next.tracking_reference || current.tracking_url !== next.tracking_url;
    if (!notifyCustomer && current.admin_notes === next.admin_notes && !(update.kind === "details" && note)) return { success: true, changed: false };

    await executeMutation(`UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ?, admin_notes = ?, postage_service = ?, tracking_reference = ?, tracking_url = ?, paid_at = CASE WHEN ? = 'PAID' THEN COALESCE(paid_at, CURRENT_TIMESTAMP(3)) ELSE paid_at END WHERE id = ?`, [next.status, next.payment_status, next.fulfillment_status, next.admin_notes, next.postage_service, next.tracking_reference, next.tracking_url, next.payment_status, orderId], connection);
    const history = await executeMutation("INSERT INTO order_status_history (order_id, administrator_id, status, note) VALUES (?, ?, ?, ?)", [orderId, administrator.id, next.status, note], connection);
    if (notifyCustomer) await enqueueOrderEmails(orderId, `update:${history.insertId}`, connection);
    await writeAuditLog({ administratorId: administrator.id, action: "ORDER_UPDATE", entityType: "order", entityId: orderId, summary: `Updated order to ${next.status}`, metadata: { kind: update.kind, paymentStatus: next.payment_status, fulfillmentStatus: next.fulfillment_status }, ipAddress }, connection);
    return { success: true, changed: true };
  });
}
