import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import type { CheckoutQuote } from "./quote";
import type { CheckoutInput } from "./validation";

type WalletDetails = Pick<StripeExpressCheckoutElementConfirmEvent, "billingDetails" | "shippingAddress">;

export function walletCheckoutInput(event: WalletDetails, quote: CheckoutQuote, items: CheckoutInput["items"], options: { couponCode?: string; marketingOptOut?: boolean }): Omit<CheckoutInput, "idempotencyKey"> {
  const billing = event.billingDetails;
  const shipping = event.shippingAddress;
  if (!billing?.address || !billing.name || !billing.email || !billing.phone || !shipping?.address || !shipping.name) throw new Error("Your wallet needs a full billing address, shipment address, email and phone number.");
  if (billing.address.country !== "GB" || shipping.address.country !== "GB") throw new Error("Billing and shipment addresses must be in the United Kingdom.");
  const phone = billing.phone;
  const address = (fullName: string, value: NonNullable<WalletDetails["billingDetails"]>["address"]) => ({ fullName, line1: value.line1 || "", line2: value.line2 || "", city: value.city || "", region: value.state || "", postalCode: value.postal_code || "", countryCode: "GB" as const, phone });
  return {
    items, countryCode: "GB", shippingMethodId: quote.shippingMethod.id, couponCode: options.couponCode,
    expectedTotalPence: quote.totalPence, customer: { name: billing.name, email: billing.email, phone },
    billingAddress: address(billing.name, billing.address), shippingAddress: address(shipping.name, shipping.address),
    marketingOptOut: options.marketingOptOut, deliveryAddressConfirmed: false, paymentMethod: "STRIPE",
  };
}
