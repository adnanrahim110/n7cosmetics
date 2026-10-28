import { z } from "zod";
import { checkoutAddressSchema } from "./checkout-validation";

export const deliveryReviewInputSchema = z.object({
  key: z.uuid(), address: checkoutAddressSchema, revision: z.number().int().nonnegative(),
});

export const deliveryReviewStateSchema = z.discriminatedUnion("required", [
  z.object({ required: z.literal(false) }),
  z.object({ required: z.literal(true), revision: z.number().int().nonnegative(), address: checkoutAddressSchema }),
]);
export type DeliveryReviewState = z.infer<typeof deliveryReviewStateSchema>;

export class DeliveryReviewError extends Error {
  constructor(message: string, readonly status: number = 409) { super(message); this.name = "DeliveryReviewError"; }
}

export function deliveryReviewRequired(order: { delivery_address_review_required: number; payment_status: string; status: string; fulfillment_status: string; tracking_reference: string | null }): boolean {
  return Boolean(order.delivery_address_review_required) && order.payment_status === "PAID" && order.fulfillment_status === "UNFULFILLED" && !order.tracking_reference && ["NEW", "CONFIRMED", "PROCESSING", "ON_HOLD"].includes(order.status);
}
