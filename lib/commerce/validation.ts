import { z } from "zod";
import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "./cart-limits";

export const cartLineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY),
});

export const cartPricingInputSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(MAX_CART_LINES).refine((items) => new Set(items.map((item) => item.slug)).size === items.length),
  couponCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]+$/).max(80).optional(),
  customerEmail: z.email().max(190).transform((value) => value.toLowerCase()).optional(),
  reservationKey: z.uuid().optional(),
});

export const quoteInputSchema = cartPricingInputSchema.extend({
  countryCode: z.literal("GB"),
  postalCode: z.string().trim().max(30).transform(value => value.toUpperCase().replace(/\s/g, "")).optional(),
  shippingMethodId: z.string().regex(/^[1-9]\d*$/).optional(),
});

const phoneSchema = z.string().trim().min(5).max(50).regex(/^[+\d\s().-]+$/);
export const checkoutAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(190),
  company: z.string().trim().max(190).optional(),
  line1: z.string().trim().min(2).max(190),
  line2: z.string().trim().max(190).optional(),
  city: z.string().trim().min(2).max(120),
  region: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().min(2).max(30),
  countryCode: z.literal("GB"),
  phone: phoneSchema,
});

export const checkoutInputSchema = quoteInputSchema.omit({ reservationKey: true }).extend({
  idempotencyKey: z.uuid(),
  expectedTotalPence: z.number().int().min(30).max(99999999),
  customer: z.object({
    name: z.string().trim().min(2).max(190),
    email: z.email().max(190).transform((value) => value.toLowerCase()),
    phone: phoneSchema,
    notes: z.string().trim().max(2000).optional(),
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
