import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import type { CheckoutInput } from "../commerce/validation";

export type WalletBilling = StripeExpressCheckoutElementConfirmEvent["billingDetails"];

export function stripeConfirmationDetails(payload: Omit<CheckoutInput, "idempotencyKey">, walletBilling?: WalletBilling) {
  const address = payload.billingAddress;
  const shipping = payload.shippingAddress;
  return {
    payment_method_data: { billing_details: walletBilling ? {
      name: walletBilling.name, email: walletBilling.email ?? payload.customer.email, phone: walletBilling.phone ?? payload.customer.phone,
      address: walletBilling.address,
    } : {
      name: address.fullName, email: payload.customer.email, phone: payload.customer.phone,
      address: { line1: address.line1, line2: address.line2, city: address.city, state: address.region, postal_code: address.postalCode, country: address.countryCode },
    } },
    shipping: { name: shipping.fullName, phone: shipping.phone, address: { line1: shipping.line1, line2: shipping.line2, city: shipping.city, state: shipping.region, postal_code: shipping.postalCode, country: shipping.countryCode } },
  };
}
