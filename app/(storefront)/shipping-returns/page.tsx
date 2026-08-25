import type { Metadata } from "next";
import {
  LegalContactCard,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";
import {
  formatDeliveryEstimate,
  formatPolicyMoney,
  getPublicShippingMethods,
} from "@/lib/commerce/legal";
import { getPublicSiteSettings } from "@/lib/commerce/settings";

export const metadata: Metadata = {
  title: "Shipping & Returns | N7 Cosmetics",
  description:
    "Read N7 Cosmetics delivery times, shipping charges, returns conditions, and customer support information.",
};

const navigation = [
  { href: "#shipping", label: "Shipping policy" },
  { href: "#returns", label: "Returns policy" },
  { href: "#marketing", label: "Marketing consent" },
  { href: "#help", label: "Need help?" },
] as const;

export default async function ShippingReturnsPage() {
  const [settings, shippingMethods] = await Promise.all([
    getPublicSiteSettings(),
    getPublicShippingMethods("GB"),
  ]);
  const currency = settings.currency || "GBP";

  return (
    <LegalPage
      eyebrow="Customer care"
      title="Shipping & Returns"
      introduction="Everything you need to know about delivery, returning an item, and getting support from the N7 Cosmetics team."
      navigation={[...navigation]}
    >
      <LegalSection id="shipping" number="01" title="Shipping policy">
        <p>
          At N7 Cosmetics, we strive to deliver your orders as quickly as
          possible. The delivery options below are maintained by our team and
          the final available methods are confirmed at checkout.
        </p>

        {shippingMethods.length ? (
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {shippingMethods.map((method) => {
              const estimate = formatDeliveryEstimate(
                method.estimatedDaysMin,
                method.estimatedDaysMax,
              );
              const deliveryPrice =
                method.methodType === "FREE_SHIPPING" || method.pricePence === 0
                  ? "Free"
                  : formatPolicyMoney(method.pricePence, currency);

              return (
                <div
                  className="border border-black/10 bg-white/35 p-5"
                  key={method.id}
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8d6745]">
                    Delivery option
                  </p>
                  <h3 className="mt-2 font-heading text-2xl text-black/85">
                    {method.name}
                  </h3>
                  <dl className="mt-5 space-y-3 border-t border-black/10 pt-4 text-sm">
                    <div className="flex items-start justify-between gap-5">
                      <dt className="text-black/42">Postage</dt>
                      <dd className="text-right font-medium text-black/72">
                        {deliveryPrice}
                      </dd>
                    </div>
                    {method.freeOverPence !== null ? (
                      <div className="flex items-start justify-between gap-5">
                        <dt className="text-black/42">Free shipping</dt>
                        <dd className="text-right font-medium text-black/72">
                          Orders over{" "}
                          {formatPolicyMoney(method.freeOverPence, currency)}
                        </dd>
                      </div>
                    ) : null}
                    {estimate ? (
                      <div className="flex items-start justify-between gap-5">
                        <dt className="text-black/42">Estimated delivery</dt>
                        <dd className="text-right font-medium text-black/72">
                          {estimate}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="border-l border-[#967C55]/45 pl-6">
            Delivery charges, qualifying thresholds, and estimated times are
            shown at checkout for the delivery address you provide.
          </p>
        )}
      </LegalSection>

      <LegalSection id="returns" number="02" title="Returns policy">
        <p>
          If you are not satisfied with your purchase, we offer a simple return
          process. Please note the following conditions:
        </p>
        <LegalList>
          <li>
            Items must be returned in their original condition, unopened and
            unused, within 30 days of receiving the product.
          </li>
          <li>
            The customer is responsible for return postage costs unless the
            item received was damaged or incorrect.
          </li>
        </LegalList>
        <p>
          Contact our team before sending a return so we can confirm the next
          steps and help your return reach the correct destination.
        </p>
      </LegalSection>

      <LegalSection id="marketing" number="03" title="Consent for marketing">
        <p>
          By completing your purchase, you consent to the collection and
          storage of your data for marketing purposes. We respect your privacy
          and protect your data in line with GDPR requirements.
        </p>
      </LegalSection>

      <LegalSection id="help" number="04" title="Questions and support">
        <LegalContactCard
          description="For questions about delivery, damaged or incorrect items, refunds, or returns, contact us using the details maintained by our team."
          settings={settings}
        />
      </LegalSection>
    </LegalPage>
  );
}
