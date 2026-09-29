import type Stripe from "stripe";

export interface ReceiptPayment {
  method: string;
  reference: string | null;
  paidAt: Date | null;
  amountPaid: number | null;
  amountRefunded: number | null;
  testMode: boolean;
  note?: string;
}

export function paymentProviderLabel(provider: string | null): string {
  const labels: Record<string, string> = { STRIPE: "Card (Stripe)", CARD: "Card", BANK_TRANSFER: "Bank transfer", CASH_ON_DELIVERY: "Cash on delivery", PAYPAL: "PayPal" };
  return provider ? labels[provider.toUpperCase()] || provider.replaceAll("_", " ") : "Not recorded";
}

// Read only the receipt fields from the verified charge. Never expose the full Stripe response.
export function stripeReceiptPayment(intent: Stripe.PaymentIntent, order: { id: string; reference: string; total: number; currency: string; mode: "test" | "live" }): ReceiptPayment | null {
  if (intent.id !== order.reference || intent.metadata.n7_order_id !== order.id
    || intent.amount !== order.total || intent.currency.toUpperCase() !== order.currency.toUpperCase()
    || intent.livemode !== (order.mode === "live")) return null;
  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  if (!charge || !charge.paid || !charge.captured || charge.status !== "succeeded"
    || (typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id) !== intent.id) return null;
  const card = charge.payment_method_details?.card;
  const brands: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", diners: "Diners Club", jcb: "JCB", unionpay: "UnionPay" };
  const wallets: Record<string, string> = { apple_pay: "Apple Pay", google_pay: "Google Pay", link: "Link", samsung_pay: "Samsung Pay" };
  const brand = card?.brand ? brands[card.brand] || "Card" : "Card";
  const last4 = card?.last4 && /^\d{4}$/.test(card.last4) ? ` •••• ${card.last4}` : "";
  const wallet = card?.wallet?.type ? wallets[card.wallet.type] : null;
  return {
    method: `${brand}${last4}${wallet ? ` (${wallet})` : ""}`,
    reference: charge.id,
    paidAt: new Date(charge.created * 1000),
    amountPaid: intent.amount_received,
    amountRefunded: charge.amount_refunded,
    testMode: !intent.livemode,
    ...(!card ? { note: "Card details are unavailable for this payment." } : {}),
  };
}
