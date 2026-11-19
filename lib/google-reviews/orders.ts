import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "../db/query";
import { readDispatchSchedule } from "../commerce/dispatch";
import { getGoogleReviewsSettings } from "./settings";
import { googleReviewDeliveryDate } from "./delivery-date";
import { googleReviewSurveySchema, type GoogleReviewSurvey } from "./survey";

interface ReviewOrder extends RowDataPacket {
  customer_email: string; order_number: string; country_code: string;
  paid_at: Date; shipping_snapshot_json: unknown;
}

export async function getGoogleReviewSurvey(checkoutKey: string): Promise<GoogleReviewSurvey | null> {
  if (!z.uuid().safeParse(checkoutKey).success) return null;
  const { settings } = await getGoogleReviewsSettings();
  if (!settings.surveyEnabled || !settings.merchantId) return null;
  // The receipt capability selects the order. Never use customer/order fields
  // or a claimed payment result supplied by the browser to build this payload.
  const row = await selectOne<ReviewOrder>(`SELECT o.order_number, o.customer_email, o.paid_at, o.shipping_snapshot_json, a.country_code
    FROM payments p JOIN orders o ON o.id = p.order_id JOIN stripe_checkouts checkout ON checkout.order_id = o.id
    JOIN order_addresses a ON a.order_id = o.id AND a.address_type = 'SHIPPING'
    WHERE p.idempotency_key = ? AND p.provider = 'STRIPE' AND o.source = 'LIVE' AND o.payment_status = 'PAID'
    AND o.status NOT IN ('CANCELLED','REFUNDED','FAILED') AND checkout.stripe_mode = 'live' AND checkout.inventory_state = 'COMMITTED'
    AND o.delivery_address_review_required = 0 AND o.paid_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY)`, [checkoutKey]);
  if (!row) return null;
  const dispatch = await selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = 'shipping.dispatch_schedule'");
  const schedule = readDispatchSchedule(dispatch?.value_json);
  if (!schedule) return null;
  const date = googleReviewDeliveryDate(new Date(row.paid_at), row.shipping_snapshot_json, schedule, settings.fallbackDeliveryDays);
  const result = googleReviewSurveySchema.safeParse({ merchant_id: Number(settings.merchantId), order_id: row.order_number,
    email: row.customer_email, delivery_country: row.country_code, estimated_delivery_date: date, opt_in_style: "CENTER_DIALOG" });
  return result.success ? result.data : null;
}
