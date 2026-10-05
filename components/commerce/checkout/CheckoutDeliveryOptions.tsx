import type { CheckoutQuote } from "@/lib/commerce/quote";
import { cn } from "@/lib/cn";
import { checkoutFocus, checkoutMoney } from "./styles";

export default function CheckoutDeliveryOptions({ quote, disabled, onChange }: { quote: CheckoutQuote; disabled: boolean; onChange: (id: string) => void }) {
  if (quote.shippingMethods.length < 2) return null;
  return (
    <fieldset className="mt-4 min-w-0 border-t border-[#e8e3d9] pt-3" disabled={disabled}>
      <legend className="pr-2 text-sm font-semibold">Delivery method</legend>
      {quote.shippingMethods.map((method) => (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm has-disabled:cursor-not-allowed" key={method.id}>
          <input className={cn("size-4 shrink-0 accent-blue-600", checkoutFocus)} type="radio" name="shippingMethod" checked={quote.shippingMethod.id === method.id} onChange={() => onChange(method.id)} />
          <span className="min-w-0 flex-1 wrap-break-word">{method.name}{method.adjustment ? <span className="block text-xs text-[#196029]">{method.adjustment.name}</span> : null}</span>
          <span className="shrink-0 text-right tabular-nums">{method.adjustment ? <del className="block text-xs text-[#625f59]">{checkoutMoney(method.basePricePence, quote.currency)}</del> : null}{method.pricePence ? checkoutMoney(method.pricePence, quote.currency) : "Free"}</span>
        </label>
      ))}
    </fieldset>
  );
}
