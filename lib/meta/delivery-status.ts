export type MetaCaptureReason = "ELIGIBLE" | "NO_CONSENT" | "CONSENT_DENIED" | "CONSENT_WITHDRAWN" | "NOT_CONFIGURED" | "TRACKING_DISABLED" | "SERVER_DISABLED" | "CAPTURE_FAILED";
export interface MetaDeliveryInput {
  source: string; paymentStatus: string; stripeMode?: string | null;
  captureReason?: string | null; hasContext: boolean;
  serverEnabled?: boolean; settingsMatch?: boolean; consentValid?: boolean;
  capiEnabled: boolean; testMode: boolean; status?: string | null; error?: string | null;
  paidAt?: Date | null;
}
export interface MetaDeliveryStatus { status: "Sent" | "Skipped" | "Pending" | "Failed" | "Unavailable"; reason: string }
export function metaDeliveryStatus(value: MetaDeliveryInput, now = Date.now()): MetaDeliveryStatus {
  if (value.status === "SENT") return { status: "Sent", reason: value.testMode ? "Meta accepted a test Purchase. It does not count as a live conversion." : "Meta accepted the server Purchase. Campaign attribution is determined by Meta." };
  if (value.source !== "LIVE") return { status: "Skipped", reason: "Historical orders are not sent to Meta." };
  if (value.status === "FAILED") return { status: "Failed", reason: value.error || "Meta event delivery failed." };
  if (value.status === "CANCELLED") return { status: "Skipped", reason: value.error || "Settings changed or marketing consent was withdrawn." };
  if (["PENDING", "PROCESSING"].includes(value.status ?? "")) return { status: "Pending", reason: value.error ? `Retry scheduled: ${value.error}` : "Purchase is queued for server delivery." };
  if (value.paymentStatus !== "PAID") return { status: "Skipped", reason: "No paid Purchase to send. Delivery starts after payment succeeds." };
  const reasons: Record<string, string> = {
    NO_CONSENT: "Marketing consent was not granted at checkout.",
    CONSENT_DENIED: "The customer declined marketing tracking.",
    CONSENT_WITHDRAWN: "Marketing consent was withdrawn before delivery.",
    NOT_CONFIGURED: "Meta tracking was not configured at checkout.",
    TRACKING_DISABLED: "Meta tracking was paused at checkout.",
    SERVER_DISABLED: "Conversions API was disabled at checkout; only browser tracking was eligible.",
    CAPTURE_FAILED: "Checkout tracking context could not be saved. Check database and encryption settings.",
  };
  if (value.captureReason && reasons[value.captureReason]) return { status: value.captureReason === "CAPTURE_FAILED" ? "Failed" : "Skipped", reason: reasons[value.captureReason] };
  if (!value.hasContext) {
    if (value.captureReason === "ELIGIBLE" && value.paidAt && now - value.paidAt.getTime() > 47 * 60 * 60 * 1000) return { status: "Failed", reason: "Eligible checkout was recorded but the server delivery window expired without retained acceptance." };
    return { status: "Unavailable", reason: "No retained checkout context or delivery record. The original skip reason was not recorded." };
  }
  if (value.stripeMode !== "live" && !value.testMode) return { status: "Skipped", reason: "Stripe test payments are excluded from live Meta events." };
  if (!value.serverEnabled) return { status: "Skipped", reason: "Conversions API was disabled at checkout; only browser tracking was eligible." };
  if (!value.consentValid) return { status: "Skipped", reason: "Marketing consent has expired or was withdrawn." };
  if (!value.settingsMatch) return { status: "Skipped", reason: "Dataset or test mode changed after checkout." };
  if (!value.capiEnabled) return { status: "Pending", reason: "Server delivery is paused. Enable Conversions API with valid credentials." };
  if (value.paidAt && now - value.paidAt.getTime() > 47 * 60 * 60 * 1000) return { status: "Failed", reason: "The server delivery window expired." };
  return { status: "Pending", reason: "Payment succeeded; awaiting the Meta delivery worker." };
}
