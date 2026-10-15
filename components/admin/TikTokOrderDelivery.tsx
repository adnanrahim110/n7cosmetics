import { getTikTokOrderDelivery } from "@/lib/tiktok/diagnostics";
export default async function TikTokOrderDelivery({ orderId }: { orderId: string }) {
  const result = await getTikTokOrderDelivery(orderId).catch(() => null);
  const reasons: Record<string, string> = {
    NO_CONSENT: "Not tracked: marketing consent was not granted at checkout.",
    CONSENT_DENIED: "Not tracked: the customer declined marketing measurement.",
    CONSENT_WITHDRAWN: "Further tracking stopped after marketing consent was withdrawn.",
    NOT_CONFIGURED: "TikTok tracking was paused or not configured at checkout.",
    SERVER_DISABLED: "Server tracking was not enabled at checkout.",
    CAPTURE_FAILED: "Tracking details could not be saved. The order was processed normally.",
  };
  const message = !result ? "No tracking record is available for this order." : result.status === "SENT" ? `Accepted by TikTok${result.test_mode ? " as a test event" : ""}.` : result.status ? `${result.status}. ${result.last_error ?? ""}` : reasons[result.capture_reason] ?? (result.stripe_mode !== "live" && !result.test_event_code ? "Stripe test purchases are excluded from live reporting." : result.payment_status === "PAID" ? "Awaiting the delivery worker. Check TikTok settings and worker status." : "Purchase is tracked only after Stripe confirms payment.");
  return <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6" aria-labelledby="tiktok-order-delivery-title"><h2 id="tiktok-order-delivery-title" className="font-body font-semibold text-zinc-950">TikTok Purchase tracking</h2><p className="mt-4 text-sm leading-6 text-zinc-700">{message}</p>{result?.attempts ? <p className="mt-2 text-xs text-zinc-600">Delivery attempts: {result.attempts}</p> : null}</section>;
}
