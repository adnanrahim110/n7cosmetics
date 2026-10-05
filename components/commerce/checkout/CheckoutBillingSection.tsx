import { MapPin } from "lucide-react";
import type { CheckoutAddressDetails } from "@/lib/commerce/saved-checkout";
import CheckoutAddressFields from "../CheckoutAddressFields";
import CheckoutSectionHeading from "./CheckoutSectionHeading";
import { checkoutCard } from "./styles";

interface CheckoutBillingSectionProps {
  address: CheckoutAddressDetails;
  onAddressChange: (address: CheckoutAddressDetails) => void;
  disabled: boolean;
}

export default function CheckoutBillingSection({ address, onAddressChange, disabled }: CheckoutBillingSectionProps) {
  return (
    <section aria-labelledby="checkout-billing-title" className={checkoutCard}>
      <CheckoutSectionHeading id="checkout-billing-title" title="Billing Information" description="Enter the address associated with your payment method" icon={MapPin} />
      <fieldset className="mt-6 min-w-0" disabled={disabled}>
        <CheckoutAddressFields prefix="billing" value={address} onChange={onAddressChange} />
      </fieldset>
    </section>
  );
}
