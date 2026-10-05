import { Mail } from "lucide-react";
import Link from "next/link";
import { checkoutMarketingCopy } from "@/lib/commerce/checkout-preferences";
import CheckoutCheckbox from "./CheckoutCheckbox";
import CheckoutField from "./CheckoutField";
import CheckoutSectionHeading from "./CheckoutSectionHeading";
import { checkoutCard, checkoutFocus } from "./styles";
import { cn } from "@/lib/cn";

interface CheckoutContactSectionProps {
  email: string;
  onEmailChange: (email: string) => void;
  marketingOptOut: boolean;
  onMarketingOptOutChange: (optOut: boolean) => void;
  disabled: boolean;
}

export default function CheckoutContactSection({ email, onEmailChange, marketingOptOut, onMarketingOptOutChange, disabled }: CheckoutContactSectionProps) {
  return (
    <section aria-labelledby="checkout-contact-title" className={checkoutCard}>
      <CheckoutSectionHeading id="checkout-contact-title" title={checkoutMarketingCopy.title} description={checkoutMarketingCopy.introduction} icon={Mail}>
        <p className="pt-1 text-xs text-[#625f59]"><span className="text-[#9d3e21]">*</span> Required fields</p>
      </CheckoutSectionHeading>
      <fieldset className="mt-6 min-w-0" disabled={disabled}>
        <CheckoutField label="Email address" name="email" autoComplete="email" maxLength={190} placeholder="you@example.com" required type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} />
        <div className="mt-2">
          <CheckoutCheckbox name="marketingEmails" checked={!marketingOptOut} onChange={(event) => onMarketingOptOutChange(!event.target.checked)}>
            {checkoutMarketingCopy.checkbox}
          </CheckoutCheckbox>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#625f59]">
          {checkoutMarketingCopy.unsubscribe} {checkoutMarketingCopy.privacy}{" "}
          <Link className={cn("rounded text-[#805915] underline underline-offset-2 hover:text-black", checkoutFocus)} href="/privacy">Privacy Policy</Link>.
        </p>
      </fieldset>
    </section>
  );
}
