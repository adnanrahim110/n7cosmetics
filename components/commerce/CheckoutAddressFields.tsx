import { ChevronDown, CirclePlus } from "lucide-react";
import { useId, type ChangeEvent, type ReactNode } from "react";
import type { CheckoutAddressDetails } from "@/lib/commerce/saved-checkout";
import { checkoutInternationalPhone, checkoutPhoneNumber } from "@/lib/commerce/checkout-phone";
import { cn } from "@/lib/cn";
import UkFlagIcon from "@/components/ui/UkFlagIcon";
import Accordion from "@/components/ui/Accordion";
import CheckoutField from "./checkout/CheckoutField";
import CheckoutFieldError from "./checkout/CheckoutFieldError";
import { useCheckoutFieldValidation } from "./checkout/CheckoutValidationProvider";
import { checkoutFocus } from "./checkout/styles";

interface CheckoutAddressFieldsProps {
  prefix: "billing" | "shipping";
  value: CheckoutAddressDetails;
  onChange: (value: CheckoutAddressDetails) => void;
  children?: ReactNode;
}

export default function CheckoutAddressFields({ prefix, value, onChange, children }: CheckoutAddressFieldsProps) {
  const phoneId = useId();
  const phoneValidation = useCheckoutFieldValidation(`${prefix}.phone`);
  const autocomplete = (field: string) => `${prefix} ${field}`;
  const field = (key: Exclude<keyof CheckoutAddressDetails, "countryCode">) => ({
    value: value[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: event.target.value }),
  });
  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
      <CheckoutField {...field("firstName")} label="First name" name={`${prefix}.firstName`} autoComplete={autocomplete("given-name")} maxLength={90} placeholder="First name" required />
      <CheckoutField {...field("lastName")} label="Last name" name={`${prefix}.lastName`} autoComplete={autocomplete("family-name")} maxLength={90} placeholder="Last name" required />
      <CheckoutField {...field("line1")} label="Street address" containerClassName="sm:col-span-2" name={`${prefix}.line1`} autoComplete={autocomplete("address-line1")} maxLength={190} minLength={2} placeholder="House number and street name" required />
      <CheckoutField {...field("city")} label="Town / City" name={`${prefix}.city`} autoComplete={autocomplete("address-level2")} maxLength={120} minLength={2} placeholder="Town / City" required />
      <CheckoutField {...field("postalCode")} label="Postcode" name={`${prefix}.postalCode`} autoComplete={autocomplete("postal-code")} maxLength={30} minLength={2} pattern="(?:[A-Za-z]{1,2}[0-9][A-Za-z0-9]?\s?[0-9][A-Za-z]{2}|[Gg][Ii][Rr]\s?0[Aa][Aa])" title="Enter a full UK postcode, for example SW1A 1AA" placeholder="e.g. SW1A 1AA" required />
      <div className="min-w-0 text-sm font-semibold sm:col-span-2">
        <label htmlFor={phoneId}>Phone number <span className="text-[#9d3e21]">*</span></label>
        <div className={cn("mt-1 flex min-w-0 rounded border border-[#d4d2cc] bg-white shadow-xs focus-within:border-[#a67520] focus-within:ring-2 focus-within:ring-[#a67520]/20", phoneValidation.error && "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20")}>
          <span aria-hidden="true" className="flex shrink-0 items-center gap-2 border-r border-[#d4d2cc] px-3 font-normal"><UkFlagIcon /><span>+44</span></span>
          <input aria-describedby={phoneValidation.error ? `${phoneId}-error` : undefined} aria-invalid={Boolean(phoneValidation.error)} className="min-h-11 w-full min-w-0 rounded-r bg-transparent px-4 py-3 font-normal placeholder:text-[#6b6862]" id={phoneId} name={`${prefix}.phoneNational`} type="tel" autoComplete={autocomplete("tel-national")} minLength={5} maxLength={46} placeholder="7123 456789" required value={checkoutPhoneNumber(value.phone)} onBlur={phoneValidation.onBlur} onChange={(event) => { phoneValidation.onChange(); onChange({ ...value, phone: checkoutInternationalPhone(event.target.value) }); }} />
        </div>
        <CheckoutFieldError id={`${phoneId}-error`} message={phoneValidation.error} />
      </div>
      <input name={`${prefix}.phone`} type="hidden" value={value.phone} />
      <input name={`${prefix}.countryCode`} type="hidden" value="GB" />
      {children ? <div className="-mt-3 sm:col-span-2">{children}</div> : null}
      <Accordion
        className="rounded border border-[#e8e3d9] sm:col-span-2"
        open={value.company || value.line2 || value.region ? true : undefined}
        summaryClassName={cn("flex items-center gap-3 rounded px-3 py-3 text-sm font-normal hover:bg-[#f1ede5]", checkoutFocus)}
        summary={
          <>
            <CirclePlus aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.7} />
            <span className="min-w-0 flex-1">Add company name or apartment (optional)</span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-300 ease-in-out group-open:rotate-180 motion-reduce:transition-none" />
          </>
        }
      >
        <div className="grid gap-4 border-t border-[#e8e3d9] p-4">
          <CheckoutField {...field("company")} label="Company name (optional)" name={`${prefix}.company`} autoComplete={autocomplete("organization")} maxLength={190} />
          <CheckoutField {...field("line2")} label="Apartment, suite or unit (optional)" name={`${prefix}.line2`} autoComplete={autocomplete("address-line2")} maxLength={190} />
          <CheckoutField {...field("region")} label="County (optional)" name={`${prefix}.region`} autoComplete={autocomplete("address-level1")} maxLength={120} />
        </div>
      </Accordion>
    </div>
  );
}
