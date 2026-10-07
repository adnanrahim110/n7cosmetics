import { z } from "zod";
import { checkoutEmailSchema, checkoutFullNameSchema, checkoutPhoneSchema, checkoutPostcodeSchema } from "../commerce/checkout-validation";

export const metaMatchingInputSchema = z.object({
  email: checkoutEmailSchema,
  phone: checkoutPhoneSchema.optional(),
  fullName: checkoutFullNameSchema.optional(),
  city: z.string().trim().min(2).max(120).optional(),
  region: z.string().trim().max(120).optional(),
  postalCode: checkoutPostcodeSchema.optional(),
  countryCode: z.literal("GB").optional(),
}).strict();
export type MetaMatchingInput = z.infer<typeof metaMatchingInputSchema>;

function validOptional<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  if (value === "" || value === undefined) return undefined;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

// Incomplete optional fields must not suppress an already valid email, or send
// unfinished/invalid values. Only these contact/locality fields are permitted.
export function checkoutMetaMatching(input: MetaMatchingInput): MetaMatchingInput | null {
  const email = checkoutEmailSchema.safeParse(input.email);
  if (!email.success) return null;
  return {
    email: email.data,
    phone: validOptional(metaMatchingInputSchema.shape.phone, input.phone),
    fullName: validOptional(metaMatchingInputSchema.shape.fullName, input.fullName),
    city: validOptional(metaMatchingInputSchema.shape.city, input.city),
    region: validOptional(metaMatchingInputSchema.shape.region, input.region),
    postalCode: validOptional(metaMatchingInputSchema.shape.postalCode, input.postalCode),
    countryCode: validOptional(metaMatchingInputSchema.shape.countryCode, input.countryCode),
  };
}
