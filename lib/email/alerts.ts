import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { getEmailPreferences } from "./brand";
import { enqueueStoreNotification } from "./notifications";
import { notificationRecipients, readSetting } from "./settings";
import { storeAlertEmail } from "./templates";

export async function enqueuePaymentFailureAlert(orderId: string, connection: PoolConnection): Promise<void> {
  const brand = await getEmailPreferences(connection);
  if (!notificationRecipients(brand.notifications, "payment_failure").length) return;
  const order = await selectOne<RowDataPacket & { order_number: string; customer_email: string }>("SELECT order_number, customer_email FROM orders WHERE id = ? AND source = 'LIVE'", [orderId], connection);
  if (!order) return;
  const email = storeAlertEmail(brand, "payment-failure-team", [["Order", order.order_number], ["Customer email", order.customer_email]], `/admin/orders/${orderId}`);
  await enqueueStoreNotification(brand, "payment_failure", { ...email, replyTo: order.customer_email, templateKey: "payment-failure-team" }, `order:${orderId}`, connection);
}

interface LowStockRow extends RowDataPacket { id: string; product_id: string; name: string; title: string; sku: string; stock_on_hand: number; low_stock_threshold: number }

export async function enqueueLowStockAlerts(): Promise<void> {
  const preferences = await getEmailPreferences();
  if (!notificationRecipients(preferences.notifications, "low_stock").length) return;
  await withTransaction(async (connection) => {
    // One shared row serialises scans across workers. State and jobs commit together.
    await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES ('email.low_stock_state', 'email', '[]', 0) ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key)", [], connection);
    const saved = await selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = 'email.low_stock_state' FOR UPDATE", [], connection);
    const brand = await getEmailPreferences(connection);
    if (!notificationRecipients(brand.notifications, "low_stock").length) return;
    const state = readSetting(saved?.value_json);
    const notified = new Set(Array.isArray(state) ? state.filter((id): id is string => typeof id === "string") : []);
    const rows = await selectRows<LowStockRow>(`SELECT CAST(v.id AS CHAR) AS id, CAST(v.product_id AS CHAR) AS product_id, p.name, v.title, v.sku, v.stock_on_hand, v.low_stock_threshold
      FROM product_variants v JOIN products p ON p.id = v.product_id
      WHERE v.status = 'ACTIVE' AND p.status = 'ACTIVE' AND p.track_inventory = 1 AND v.stock_on_hand <= v.low_stock_threshold ORDER BY v.id`, [], connection);
    for (const row of rows) {
      if (notified.has(row.id)) continue;
      const email = storeAlertEmail(brand, "low-stock-team", [["Product", row.name], ["Variant", row.title], ["SKU", row.sku], ["Available", String(row.stock_on_hand)], ["Alert threshold", String(row.low_stock_threshold)]], `/admin/products/${row.product_id}`);
      await enqueueStoreNotification(brand, "low_stock", { ...email, replyTo: brand.replyToEmail, templateKey: "low-stock-team" }, `variant:${row.id}:${randomUUID()}`, connection);
    }
    await executeMutation("UPDATE site_settings SET value_json = ? WHERE setting_key = 'email.low_stock_state'", [JSON.stringify(rows.map((row) => row.id))], connection);
  });
}
