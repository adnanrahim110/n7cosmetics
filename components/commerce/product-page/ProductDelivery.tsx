import DispatchCountdown from "@/components/commerce/DispatchCountdown";
import {
  formatPolicyMoney,
  type PublicShippingMethod,
} from "@/lib/commerce/legal";
import type { PublicSiteSettings } from "@/lib/commerce/settings";
import { ShieldCheck, Truck } from "lucide-react";
import ProductAssuranceBox from "./ProductAssuranceBox";

export default function ProductDelivery({
  settings,
  shippingMethods,
  paymentEnabled,
}: {
  settings: PublicSiteSettings;
  shippingMethods: PublicShippingMethod[];
  paymentEnabled: boolean;
}) {
  const method = shippingMethods
    .filter((item) => item.methodType === "DELIVERY" && !item.postcodes.length)
    .sort((a, b) => a.pricePence - b.pricePence)[0];
  const freeRule = method?.freeShippingRules
    .slice()
    .sort((a, b) => a.minimumSubtotalPence - b.minimumSubtotalPence)[0];
  return (
    <aside
      aria-label="Delivery, dispatch and payment"
      className="mt-7 grid grid-cols-1 gap-px border border-black/10 bg-black/10 sm:grid-cols-3"
    >
      <ProductAssuranceBox icon={Truck} title="UK Delivery">
        {method ? (
          <p>From: {formatPolicyMoney(method.pricePence)}</p>
        ) : null}
        {freeRule ? (
          <p>Free over: {formatPolicyMoney(freeRule.minimumSubtotalPence)}</p>
        ) : null}
      </ProductAssuranceBox>
      <DispatchCountdown schedule={settings.dispatch ?? null} />
      <ProductAssuranceBox icon={ShieldCheck} title="Secure Payment">
        {paymentEnabled ? (
          <>
            <p>Visa · Mastercard</p>
            <p>Apple Pay · Google Pay</p>
          </>
        ) : (
          <p>Online payments currently unavailable.</p>
        )}
      </ProductAssuranceBox>
    </aside>
  );
}
