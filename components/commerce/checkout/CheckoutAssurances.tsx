import { Package, ShieldCheck, Truck } from "lucide-react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { useCommerce } from "../CommerceProvider";
import CheckoutAssuranceItem from "./CheckoutAssuranceItem";
import { checkoutMoney } from "./styles";

export default function CheckoutAssurances({ quote }: { quote: CheckoutQuote | null }) {
  const { cart, pricingError, pricingLoading, getStockIssue, getStock } = useCommerce();
  const stockReady = !pricingLoading && !pricingError && cart.every((item) => !getStock(item.slug).soldOut && !getStockIssue(item.slug));
  const progress = quote?.deliveryProgress;
  const delivery = quote ? `${quote.shippingPence ? checkoutMoney(quote.shippingPence, quote.currency) : "Free"}${progress?.remainingPence ? ` · Free from ${checkoutMoney(progress.thresholdPence, quote.currency)}` : ""}` : "Calculated at checkout";
  return (
    <ul aria-label="Order reassurance" className="grid grid-cols-1 gap-4 px-3 py-1 min-[400px]:grid-cols-3 sm:px-2">
      <CheckoutAssuranceItem icon={Package} title={stockReady ? "In Stock" : pricingError ? "Check availability" : "Checking stock"} description={stockReady ? "Ready to order" : pricingError ? "Review your basket" : "Confirming your items"} />
      <CheckoutAssuranceItem icon={Truck} title="UK Delivery" description={delivery} />
      <CheckoutAssuranceItem icon={ShieldCheck} title="Secure Payment" description="Encrypted & Safe" />
    </ul>
  );
}
