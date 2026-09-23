import { z } from "zod";

export const orderStatuses = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED", "ON_HOLD"] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const royalMailTrackingUrl = "https://www.royalmail.com/track-your-item";

export const orderUpdateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("status"), status: z.enum(orderStatuses) }),
  z.object({
    kind: z.literal("tracking"),
    postageService: z.string().trim().min(1, "Enter the postage service.").max(190).refine((value) => !/[\r\n]/.test(value), "Enter a single postage service."),
    trackingReference: z.string().max(190).transform((value) => value.replace(/\s/g, "").toUpperCase()).pipe(z.string().min(1, "Enter the tracking number.").regex(/^[A-Z0-9]+$/, "Use only letters and numbers from the tracking number.")),
  }),
  z.object({
    kind: z.literal("details"),
    paymentStatus: z.enum(["UNPAID", "PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"]),
    fulfillmentStatus: z.enum(["UNFULFILLED", "PARTIAL", "FULFILLED", "RETURNED"]),
    adminNotes: z.string().max(10000).nullable(),
    historyNote: z.string().max(500).nullable(),
  }),
]);

export type OrderUpdate = z.input<typeof orderUpdateSchema>;
export type OrderUpdateResult =
  | { success: true; changed: boolean }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

export function orderStatusLabel(status: string): string {
  return status.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
