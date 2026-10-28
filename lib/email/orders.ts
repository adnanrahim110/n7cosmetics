import type { PoolConnection } from "mysql2/promise";
import { selectOne } from "../db/query";
import { enqueueEmail, supersedeOrderStatusEmails } from "./queue";
import { enqueueStoreNotification } from "./notifications";
import { renderOrderMessage } from "./order-message";

export async function enqueueOrderEmails(orderId: string, event: string, connection: PoolConnection): Promise<void> {
  const customerKey = `order:${orderId}:${event}:customer`;
  // Retrying an event must not cancel its own notification, or a newer event.
  if (await selectOne("SELECT id FROM email_jobs WHERE dedupe_key = ? LIMIT 1", [customerKey], connection)) return;
  const kind = event === "confirmation" ? "confirmation" : event.startsWith("address:") ? "address" : "update";
  const customer = await renderOrderMessage(orderId, kind, connection);
  if (!customer) return;
  if (kind === "update") await supersedeOrderStatusEmails(orderId, connection);
  await enqueueEmail(customer.email, { dedupeKey: customerKey, orderId, orderKind: kind }, connection);
  const teamKind = kind === "confirmation" ? "team" : kind === "address" ? "team-address" : "team-update";
  const team = await renderOrderMessage(orderId, teamKind, connection);
  if (team) await enqueueStoreNotification(team.brand, kind === "confirmation" ? "new_order" : "order_update", team.email, `order:${orderId}:${event}`, connection, { orderId, orderKind: teamKind });
}
