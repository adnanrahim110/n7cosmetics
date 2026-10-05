import { z } from "zod";
import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "./cart-limits";
import { checkoutAddressSchema, checkoutCouponSchema, checkoutEmailSchema, checkoutFullNameSchema, checkoutNotesSchema, checkoutPhoneSchema } from "./checkout-validation";

export { checkoutAddressSchema } from "./checkout-validation";

export const cartLineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY),
});

export const cartPricingInputSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(MAX_CART_LINES).refine((items) => new Set(items.map((item) => item.slug)).size === items.length),
  couponCode: checkoutCouponSchema.optional(),
  customerEmail: checkoutEmailSchema.optional(),
  reservationKey: z.uuid().optional(),
});

export const quoteInputSchema = cartPricingInputSchema.extend({
  countryCode: z.literal("GB"),
  postalCode: z.string().trim().max(30).transform(value => value.toUpperCase().replace(/\s/g, "")).optional(),
  shippingMethodId: z.string().regex(/^[1-9]\d*$/).optional(),
});

export const cartDeliveryInputSchema = cartPricingInputSchema.extend({
  postalCode: z.string().trim().toUpperCase().transform(value => value.replace(/\s/g, ""))
    .refine(value => !value || /^(?:[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}|GIR0AA)$/.test(value), "Enter a full UK postcode.").optional(),
});

export const checkoutInputSchema = quoteInputSchema.omit({ reservationKey: true }).extend({
  idempotencyKey: z.uuid(),
  expectedTotalPence: z.number().int().min(30).max(99999999),
  customer: z.object({
    name: checkoutFullNameSchema,
    email: checkoutEmailSchema,
    phone: checkoutPhoneSchema,
    notes: checkoutNotesSchema.optional(),
  }),
  billingAddress: checkoutAddressSchema,
  shippingAddress: checkoutAddressSchema,
  // Absence means the notice was not presented (e.g. express pay on the cart).
  marketingOptOut: z.boolean().optional(),
  paymentMethod: z.literal("STRIPE"),
}).refine((input) => input.countryCode === input.shippingAddress.countryCode, { path: ["countryCode"] });

export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type CartPricingInput = z.infer<typeof cartPricingInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
