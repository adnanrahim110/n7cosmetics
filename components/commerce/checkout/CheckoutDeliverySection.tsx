import { ChevronDown, MapPin } from "lucide-react";
import { useId } from "react";
import type { CheckoutAddressDetails } from "@/lib/commerce/saved-checkout";
import { cn } from "@/lib/cn";
import Accordion from "@/components/ui/Accordion";
import CheckoutAddressFields from "../CheckoutAddressFields";
import CheckoutCheckbox from "./CheckoutCheckbox";
import CheckoutFieldError from "./CheckoutFieldError";
import CheckoutSectionHeading from "./CheckoutSectionHeading";
import { useCheckoutFieldValidation } from "./CheckoutValidationProvider";
import { checkoutCard, checkoutFocus, checkoutInput } from "./styles";

interface CheckoutDeliverySectionProps {
  address: CheckoutAddressDetails;
  prefix: "billing" | "shipping";
  onAddressChange: (address: CheckoutAddressDetails) => void;
  differentBilling: boolean;
  onDifferentBillingChange: (different: boolean) => void;
  rememberDetails: boolean;
  onRememberDetailsChange: (remember: boolean) => void;
  hasSavedDetails: boolean;
  onForgetDetails: () => void;
  detailsMessage: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  disabled: boolean;
}

export default function CheckoutDeliverySection({ address, prefix, onAddressChange, differentBilling, onDifferentBillingChange, rememberDetails, onRememberDetailsChange, hasSavedDetails, onForgetDetails, detailsMessage, notes, onNotesChange, disabled }: CheckoutDeliverySectionProps) {
  const notesId = useId();
  const notesValidation = useCheckoutFieldValidation("notes");
  return (
    <section aria-labelledby="checkout-delivery-title" className={checkoutCard}>
      <CheckoutSectionHeading id="checkout-delivery-title" title="Delivery Information" description="Enter your delivery address (UK orders only)" icon={MapPin} />
      <fieldset className="mt-6 min-w-0" disabled={disabled}>
        <CheckoutAddressFields prefix={prefix} value={address} onChange={onAddressChange}>
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <CheckoutCheckbox name="rememberDetails" checked={rememberDetails} onChange={(event) => onRememberDetailsChange(event.target.checked)}>Save my details for next time</CheckoutCheckbox>
            {hasSavedDetails ? <button className={cn("min-h-11 rounded px-2 text-xs text-[#805915] underline underline-offset-4 hover:text-black", checkoutFocus)} type="button" onClick={onForgetDetails}>Clear saved details</button> : null}
          </div>
          {detailsMessage ? <p role="status" className="text-xs leading-5 text-[#625f59]">{detailsMessage}</p> : null}
        </CheckoutAddressFields>
        <div className="mt-3">
          <CheckoutCheckbox checked={differentBilling} onChange={(event) => onDifferentBillingChange(event.target.checked)}>Use a different billing address</CheckoutCheckbox>
        </div>
        <Accordion
          className="mt-2"
          open
          summaryClassName={cn("flex items-center justify-between gap-3 rounded text-sm text-[#625f59] hover:text-black", checkoutFocus)}
          summary={
            <>
              Add an order note (optional)
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-300 ease-in-out group-open:rotate-180 motion-reduce:transition-none" />
            </>
          }
        >
          <label className="block text-sm font-semibold" htmlFor={notesId}>Order notes</label>
          <textarea aria-describedby={notesValidation.error ? `${notesId}-error` : undefined} aria-invalid={Boolean(notesValidation.error)} className={cn(checkoutInput, "mt-2 resize-y font-normal", notesValidation.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20")} id={notesId} maxLength={2000} name="notes" onBlur={notesValidation.onBlur} onChange={(event) => { notesValidation.onChange(); onNotesChange(event.target.value); }} placeholder="Anything we should know about your order?" rows={3} value={notes} />
          <CheckoutFieldError id={`${notesId}-error`} message={notesValidation.error} />
        </Accordion>
      </fieldset>
    </section>
  );
}
