import { z } from "zod";

export const checkoutEmailSchema = z.string().trim().min(1, "Enter your email address.").max(190, "Email addresses must be 190 characters or fewer.").pipe(z.email({ error: "Enter a valid email address." })).transform((value) => value.toLowerCase());
export const checkoutPhoneSchema = z.string().trim().min(1, "Enter your phone number.").max(50, "Phone numbers must be 50 characters or fewer.").regex(/^\+?[\d\s().-]+$/, "Enter a valid phone number.").refine((value) => {
  const digits = value.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}, "Enter a phone number with 7 to 15 digits.");
export const checkoutPostcodeSchema = z.string().trim().min(1, "Enter your postcode.").max(30, "Postcodes must be 30 characters or fewer.").toUpperCase().refine((value) => /^(?:[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}|GIR0AA)$/.test(value.replace(/\s/g, "")), "Enter a valid UK postcode, for example SW1A 1AA.");
export const checkoutNotesSchema = z.string().trim().max(2000, "Order notes must be 2,000 characters or fewer.");
export const checkoutFullNameSchema = z.string().trim().min(2, "Enter your full name.").max(190, "Names must be 190 characters or fewer.");
export const checkoutCouponSchema = z.string().trim().toUpperCase().min(1, "Enter a discount code.").max(80, "Discount codes must be 80 characters or fewer.").regex(/^[A-Z0-9_-]+$/, "Use only letters, numbers, hyphens and underscores.");

export const checkoutAddressSchema = z.object({
  fullName: checkoutFullNameSchema,
  company: z.string().trim().max(190, "Company names must be 190 characters or fewer.").optional(),
  line1: z.string().trim().min(2, "Enter your house number and street name.").max(190, "Street addresses must be 190 characters or fewer."),
  line2: z.string().trim().max(190, "Apartment details must be 190 characters or fewer.").optional(),
  city: z.string().trim().min(2, "Enter your town or city.").max(120, "Town or city names must be 120 characters or fewer."),
  region: z.string().trim().max(120, "County names must be 120 characters or fewer.").optional(),
  postalCode: checkoutPostcodeSchema,
  countryCode: z.literal("GB", { error: "Delivery and billing addresses must be in the United Kingdom." }),
  phone: checkoutPhoneSchema,
});

const formAddressSchema = checkoutAddressSchema.omit({ fullName: true }).extend({
  firstName: z.string().trim().min(1, "Enter your first name.").max(90, "First names must be 90 characters or fewer."),
  lastName: z.string().trim().min(1, "Enter your last name.").max(90, "Last names must be 90 characters or fewer."),
});

export const checkoutFormSchema = z.object({
  email: checkoutEmailSchema,
  billingAddress: formAddressSchema,
  shippingAddress: formAddressSchema.optional(),
  notes: checkoutNotesSchema,
});

const addressFields = ["firstName", "lastName", "company", "line1", "line2", "city", "region", "postalCode", "countryCode", "phone"] as const;
export type CheckoutFormField = "email" | "notes" | `${"billing" | "shipping"}.${typeof addressFields[number]}`;
export type CheckoutFieldErrors = Partial<Record<CheckoutFormField, string>>;

const fieldMap: Record<string, CheckoutFormField> = {
  email: "email", "customer.email": "email", customerEmail: "email",
  notes: "notes", "customer.notes": "notes", "customer.name": "billing.firstName", "customer.phone": "billing.phone",
};
for (const prefix of ["billing", "shipping"] as const) {
  for (const field of addressFields) fieldMap[`${prefix}Address.${field}`] = `${prefix}.${field}`;
  fieldMap[`${prefix}Address.fullName`] = `${prefix}.firstName`;
}
const formFields = new Set(Object.values(fieldMap));

export function checkoutFieldErrors(issues: readonly z.core.$ZodIssue[]): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  for (const issue of issues) {
    const field = fieldMap[issue.path.map(String).join(".")];
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export function readCheckoutFieldErrors(value: unknown): CheckoutFieldErrors {
  const parsed = z.record(z.string(), z.string()).safeParse(value);
  const errors: CheckoutFieldErrors = {};
  if (!parsed.success) return errors;
  for (const field of formFields) {
    const message = parsed.data[field];
    if (message) errors[field] = message.slice(0, 240);
  }
  return errors;
}

export function checkoutAddressFromForm(value: z.infer<typeof formAddressSchema>): z.infer<typeof checkoutAddressSchema> {
  const { firstName, lastName, ...address } = value;
  return { ...address, fullName: `${firstName} ${lastName}` };
}

export class CheckoutValidationError extends Error {
  readonly fieldErrors: CheckoutFieldErrors;
  constructor(message: string, fieldErrors: unknown) {
    super(message);
    this.name = "CheckoutValidationError";
    this.fieldErrors = readCheckoutFieldErrors(fieldErrors);
  }
}
