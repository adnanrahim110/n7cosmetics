import { z } from "zod";
import type { CheckoutInput } from "./validation";

export const SAVED_CHECKOUT_KEY = "n7-checkout-details-v1";

const addressSchema = z.object({
  firstName: z.string().max(90),
  lastName: z.string().max(90),
  company: z.string().max(190),
  line1: z.string().max(190),
  line2: z.string().max(190),
  city: z.string().max(120),
  region: z.string().max(120),
  postalCode: z.string().max(30),
  countryCode: z.literal("GB"),
  phone: z.string().max(50),
});

const savedDetailsSchema = z.object({
  version: z.literal(1),
  email: z.email().max(190),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  differentShipping: z.boolean(),
});

export type CheckoutAddressDetails = z.infer<typeof addressSchema>;
export type SavedCheckoutDetails = z.infer<typeof savedDetailsSchema>;
type CheckoutStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function emptyCheckoutAddress(): CheckoutAddressDetails {
  return { firstName: "", lastName: "", company: "", line1: "", line2: "", city: "", region: "", postalCode: "", countryCode: "GB", phone: "" };
}

export function loadSavedCheckoutDetails(storage: CheckoutStorage): SavedCheckoutDetails | null {
  try {
    const raw = storage.getItem(SAVED_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = savedDetailsSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch { /* Invalid or unavailable storage must never prevent checkout. */ }
  clearSavedCheckoutDetails(storage);
  return null;
}

export function saveCheckoutDetails(storage: CheckoutStorage, details: SavedCheckoutDetails): boolean {
  try {
    // Parse an explicit allowlist so payment data, order notes and marketing
    // preferences can never be persisted with the contact/address details.
    const saved = savedDetailsSchema.parse(details);
    if (!saved.differentShipping) saved.shippingAddress = { ...saved.billingAddress };
    storage.setItem(SAVED_CHECKOUT_KEY, JSON.stringify(saved));
    return true;
  } catch { return false; }
}

export function clearSavedCheckoutDetails(storage: CheckoutStorage): boolean {
  try { storage.removeItem(SAVED_CHECKOUT_KEY); return true; }
  catch { return false; }
}

export function walletCheckoutDetails(input: Omit<CheckoutInput, "idempotencyKey">): SavedCheckoutDetails {
  const address = (value: CheckoutInput["billingAddress"]): CheckoutAddressDetails => {
    const [firstName, ...lastName] = value.fullName.trim().split(/\s+/);
    return { firstName, lastName: lastName.join(" "), company: value.company || "", line1: value.line1, line2: value.line2 || "", city: value.city, region: value.region || "", postalCode: value.postalCode, countryCode: value.countryCode, phone: value.phone };
  };
  const billingAddress = address(input.billingAddress);
  const shippingAddress = address(input.shippingAddress);
  return { version: 1, email: input.customer.email, billingAddress, shippingAddress, differentShipping: JSON.stringify(billingAddress) !== JSON.stringify(shippingAddress) };
}
