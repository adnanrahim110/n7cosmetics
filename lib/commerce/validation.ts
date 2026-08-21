import { z } from "zod";

export const cartLineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
  quantity: z.number().int().min(1).max(99),
});

export const quoteInputSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(50).refine((items) => new Set(items.map((item) => item.slug)).size === items.length),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  shippingMethodId: z.string().regex(/^[1-9]\d*$/).optional(),
  couponCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]+$/).max(80).optional(),
  customerEmail: z.email().max(190).transform((value) => value.toLowerCase()).optional(),
});

export const checkoutInputSchema = quoteInputSchema.extend({
  idempotencyKey: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(2).max(190),
    email: z.email().max(190).transform((value) => value.toLowerCase()),
    phone: z.string().trim().max(50).optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(190),
    company: z.string().trim().max(190).optional(),
    line1: z.string().trim().min(2).max(190),
    line2: z.string().trim().max(190).optional(),
    city: z.string().trim().min(2).max(120),
    region: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().min(2).max(30),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    phone: z.string().trim().max(50).optional(),
  }),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER"]),
}).refine((input) => input.countryCode === input.shippingAddress.countryCode, { path: ["countryCode"] });

export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
