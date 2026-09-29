import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import { getOrderItems, type OrderItem } from "../commerce/order-items";
import { getEmailPreferences } from "../email/brand";
import { getStripeSettings, stripeClient } from "../payments/settings";
import { paymentProviderLabel, stripeReceiptPayment, type ReceiptPayment } from "../payments/receipt-details";

export interface ReceiptOrder extends RowDataPacket {
  id: string; order_number: string; source: string; status: string; payment_status: string; currency: string;
  customer_name: string; customer_email: string; customer_phone: string | null;
  subtotal_pence: number; discount_pence: number; shipping_pence: number; tax_pence: number; total_pence: number;
  coupon_code: string | null; placed_at: Date; paid_at: Date | null; payment_provider: string | null; payment_reference: string | null;
  shipping_method_name: string | null; postage_service: string | null; stripe_mode: "test" | "live" | null;
}
export interface ReceiptAddress extends RowDataPacket {
  address_type: string; full_name: string; company: string | null; line_1: string; line_2: string | null;
  city: string; region: string | null; postal_code: string; country_code: string;
}
export interface OrderReceiptData {
  order: ReceiptOrder;
  items: OrderItem[];
  addresses: ReceiptAddress[];
  brand: { appUrl: string; contactEmail?: string; address?: string };
  payment: ReceiptPayment;
  refundedPence: number;
}

export async function getOrderReceiptData(id: string): Promise<OrderReceiptData | null> {
  const order = await selectOne<ReceiptOrder>(`SELECT o.*, CAST(o.id AS CHAR) AS id, sc.stripe_mode
    FROM orders o LEFT JOIN stripe_checkouts sc ON sc.order_id = o.id WHERE o.id = ?`, [id]);
  if (!order) return null;
  const [items, addresses, brand, refunds] = await Promise.all([
    getOrderItems(id),
    selectRows<ReceiptAddress>("SELECT address_type, full_name, company, line_1, line_2, city, region, postal_code, country_code FROM order_addresses WHERE order_id = ? ORDER BY address_type", [id]),
    getEmailPreferences(),
    selectOne<RowDataPacket & { amount: number }>("SELECT COALESCE(SUM(amount_pence), 0) AS amount FROM order_refunds WHERE order_id = ?", [id]),
  ]);
  let payment: ReceiptPayment = { method: paymentProviderLabel(order.payment_provider), reference: order.payment_reference, paidAt: order.paid_at, amountPaid: null, amountRefunded: null, testMode: order.stripe_mode === "test" };
  if (order.payment_provider?.toUpperCase() === "STRIPE") {
    payment.note = "Card details are unavailable for this payment.";
    if (order.payment_reference?.startsWith("pi_") && order.stripe_mode) {
      try {
        const settings = await getStripeSettings();
        if (settings.mode === order.stripe_mode) {
          const intent = await stripeClient(settings).paymentIntents.retrieve(order.payment_reference, { expand: ["latest_charge"] }, { timeout: 8000, maxNetworkRetries: 0 });
          payment = stripeReceiptPayment(intent, { id, reference: order.payment_reference, total: order.total_pence, currency: order.currency, mode: order.stripe_mode }) || payment;
        }
      } catch {
        // Older orders and unavailable Stripe accounts still have printable order records.
        console.warn(`Card details unavailable for order ${id}.`);
      }
    }
  }
  return { order, items, addresses, brand, payment, refundedPence: Math.max(Number(refunds?.amount || 0), payment.amountRefunded || 0) };
}
