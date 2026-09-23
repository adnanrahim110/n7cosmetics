"use client";

import { useCommerce } from "@/components/commerce/CommerceProvider";
import Title from "@/components/ui/Title";
import { ChevronDown, LoaderCircle, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import CartLinePrice from "@/components/commerce/CartLinePrice";
import CartPriceSummary from "@/components/commerce/CartPriceSummary";
import CheckoutAddressFields from "@/components/commerce/CheckoutAddressFields";
import ExpressPayment from "@/components/commerce/ExpressPayment";
import StripeProvider, {
  usePaymentConfig,
} from "@/components/commerce/StripeProvider";
import { useStripePayment } from "@/components/commerce/useStripePayment";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import type { CheckoutInput } from "@/lib/commerce/validation";
import { normalizePostcode } from "@/lib/commerce/shipping";
import { checkoutMarketingCopy } from "@/lib/commerce/checkout-preferences";
import { clearSavedCheckoutDetails, emptyCheckoutAddress, loadSavedCheckoutDetails, saveCheckoutDetails, walletCheckoutDetails, type SavedCheckoutDetails } from "@/lib/commerce/saved-checkout";
import { PaymentElement, useElements } from "@stripe/react-stripe-js";

const input =
  "mt-1.5 w-full rounded-none border border-black/20 bg-white/50 px-3 py-2.5 text-sm outline-none focus:border-[#8d6745]";
function money(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    pence / 100,
  );
}

export default function CheckoutPage() {
  return (
    <StripeProvider>
      <CheckoutForm />
    </StripeProvider>
  );
}

function CheckoutForm() {
  const { cart, cartCount, cartPricing, couponCode, setCouponCode, pricingError, pricingLoading, reservationKey } =
    useCommerce();
  const elements = useElements();
  const paymentConfig = usePaymentConfig();
  const { pay, ready } = useStripePayment();
  const [differentShipping, setDifferentShipping] = useState(false);
  const [billingDetails, setBillingDetails] = useState(emptyCheckoutAddress);
  const [shippingDetails, setShippingDetails] = useState(emptyCheckoutAddress);
  const [contactEmail, setContactEmail] = useState("");
  const [marketingOptOut, setMarketingOptOut] = useState(false);
  const [rememberDetails, setRememberDetails] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const countryCode = "GB" as const;
  const [couponDraft, setCouponDraft] = useState(couponCode);
  const [quoteState, setQuoteState] = useState<{
    key: string;
    data?: CheckoutQuote;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [shippingChoice, setShippingChoice] = useState<{ basket: string; id: string } | null>(null);
  const postalCode = normalizePostcode((differentShipping ? shippingDetails : billingDetails).postalCode);
  const basket = JSON.stringify({ postalCode });

  const quoteRequest = JSON.stringify({
    items: cart.map(({ slug, quantity }) => ({ slug, quantity })),
    countryCode,
    postalCode,
    couponCode: couponCode || undefined,
    shippingMethodId: shippingChoice?.basket === basket ? shippingChoice.id : undefined,
  });
  const hasCart = cart.length > 0;
  const currentQuote = quoteState?.key === quoteRequest ? quoteState : null;
  const quote = currentQuote?.data ?? null;
  const quoting = hasCart && !currentQuote;
  const displayError = error ?? pricingError ?? currentQuote?.error;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = loadSavedCheckoutDetails(window.localStorage);
        if (!saved) return;
        setContactEmail(saved.email);
        setBillingDetails(saved.billingAddress);
        setShippingDetails(saved.shippingAddress);
        setDifferentShipping(saved.differentShipping);
        setRememberDetails(true);
        setHasSavedDetails(true);
        setDetailsMessage("Your saved details have been filled in. You can edit them in the form.");
      } catch { /* Checkout also works when this browser blocks local storage. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function forgetDetails() {
    setRememberDetails(false);
    try {
      if (clearSavedCheckoutDetails(window.localStorage)) {
        setHasSavedDetails(false);
        setDetailsMessage("Saved details cleared from this device.");
        return;
      }
    } catch { /* Explain how to remove data if storage access is blocked. */ }
    setDetailsMessage("This browser could not clear your saved details. You can remove them by clearing this website’s data in your browser settings.");
  }

  function rememberCheckout(details: SavedCheckoutDetails) {
    if (!rememberDetails) return;
    try {
      if (saveCheckoutDetails(window.localStorage, details)) {
        setHasSavedDetails(true);
        setDetailsMessage("Your details are saved on this device.");
        return;
      }
    } catch { /* Saving details must never block payment. */ }
    setDetailsMessage("Your browser could not save your details. You can still complete your order.");
  }

  useEffect(() => {
    if (quote) elements?.update({ amount: Math.max(30, quote.totalPence) });
  }, [elements, quote]);

  useEffect(() => {
    if (!hasCart) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/commerce/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...JSON.parse(quoteRequest), reservationKey }),
          signal: controller.signal,
        });
        const data = (await response.json()) as CheckoutQuote & {
          error?: string;
          code?: string;
        };
        if (!response.ok && data.code === "DELIVERY_UNAVAILABLE" && JSON.parse(quoteRequest).shippingMethodId && !controller.signal.aborted) {
          setShippingChoice(null);
          return;
        }
        if (!response.ok)
          throw new Error(data.error ?? "Unable to calculate checkout.");
        if (!controller.signal.aborted)
          setQuoteState({ key: quoteRequest, data });
      } catch (reason) {
        if (!controller.signal.aborted)
          setQuoteState({
            key: quoteRequest,
            error:
              reason instanceof Error
                ? reason.message
                : "Unable to calculate checkout.",
          });
      }
    };
    void load();
    return () => controller.abort();
  }, [hasCart, quoteRequest, reservationKey, pricingError]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || quoting || placing || pricingLoading || pricingError) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const read = (key: string) => String(formData.get(key) ?? "").trim();
    const address = (prefix: string): CheckoutInput["billingAddress"] => ({
      fullName:
        `${read(`${prefix}.firstName`)} ${read(`${prefix}.lastName`)}`.trim(),
      company: read(`${prefix}.company`),
      line1: read(`${prefix}.line1`),
      line2: read(`${prefix}.line2`),
      city: read(`${prefix}.city`),
      region: read(`${prefix}.region`),
      postalCode: read(`${prefix}.postalCode`),
      countryCode,
      phone: read(`${prefix}.phone`),
    });
    const billingAddress = address("billing");
    const payload: Omit<CheckoutInput, "idempotencyKey"> = {
      items: cart.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      countryCode,
      shippingMethodId: quote.shippingMethod.id,
      couponCode: quote.discount?.couponCode ?? undefined,
      customerEmail: email,
      expectedTotalPence: quote.totalPence,
      customer: {
        name: billingAddress.fullName,
        email,
        phone: billingAddress.phone,
        notes: read("notes"),
      },
      billingAddress,
      shippingAddress: differentShipping ? address("shipping") : billingAddress,
      marketingOptOut,
      paymentMethod: "STRIPE",
    };
    rememberCheckout({ version: 1, email, billingAddress: billingDetails, shippingAddress: differentShipping ? shippingDetails : billingDetails, differentShipping });
    setPlacing(true);
    setError(undefined);
    try {
      await pay(payload);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to place the order.",
      );
    } finally {
      setPlacing(false);
    }
  }

  if (!cart.length) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-16 pt-40 text-[#1c1814] sm:pb-20 sm:pt-44">
        <div className="text-center">
          <Title as="h1" text="Your cart is empty" tone="gold" />
          <Link
            className="mt-7 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
            href="/recreations"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3eee5] pb-16 pt-40 text-[#1c1814] sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
          Secure order
        </p>
        <Title as="h1" className="mt-3" text="Checkout" tone="gold" />
        {displayError ? (
          <div
            role="alert"
            className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {displayError}
          </div>
        ) : null}

        <form
          className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1fr_360px]"
          onSubmit={submitOrder}
        >
          <div className="space-y-6">
            <fieldset disabled={placing} className="space-y-5 border border-black/10 bg-white/35 p-4 sm:p-6">
              <Title text="Contact details" tone="gold" variant="small" />
              <label className="block text-sm">
                Email address *
                <input className={input} name="email" autoComplete="email" maxLength={190} required type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </label>
              <div className="space-y-3 border-t border-black/10 pt-5">
                <h2 className="text-base font-medium">{checkoutMarketingCopy.title}</h2>
                <p className="text-sm leading-6 text-black/65">{checkoutMarketingCopy.introduction}</p>
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
                  <input className="mt-1 size-4 shrink-0 accent-[#8d6745]" type="checkbox" name="marketingOptOut" checked={marketingOptOut} onChange={(event) => setMarketingOptOut(event.target.checked)} />
                  <span>{checkoutMarketingCopy.checkbox}</span>
                </label>
                <p className="text-xs leading-5 text-black/60">
                  {checkoutMarketingCopy.unsubscribe} {checkoutMarketingCopy.privacy}{" "}
                  <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
                </p>
              </div>
            </fieldset>
            {quote && (placing || (!pricingLoading && !pricingError)) ? <ExpressPayment quote={quote} marketingOptOut={marketingOptOut} onCheckoutDetails={(payload) => rememberCheckout(walletCheckoutDetails(payload))} onBusyChange={setPlacing} /> : null}
            <fieldset
              disabled={placing}
              className="grid gap-5 border border-black/10 bg-white/35 p-4 sm:grid-cols-2 sm:p-6"
            >
              <Title
                className="sm:col-span-2"
                text="Billing details"
                tone="gold"
                variant="small"
              />
              <CheckoutAddressFields prefix="billing" value={billingDetails} onChange={setBillingDetails} />
              <label className="flex items-center gap-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={differentShipping}
                  onChange={(event) =>
                    setDifferentShipping(event.target.checked)
                  }
                />
                Ship to a different address?
              </label>
              {differentShipping ? (
                <>
                  <Title
                    className="sm:col-span-2"
                    text="Shipping details"
                    tone="gold"
                    variant="small"
                  />
                  <CheckoutAddressFields prefix="shipping" value={shippingDetails} onChange={setShippingDetails} />
                </>
              ) : null}
              <label className="text-sm sm:col-span-2">
                Order notes (optional)
                <textarea
                  className={input}
                  maxLength={2000}
                  name="notes"
                  rows={3}
                />
              </label>
            </fieldset>

            <fieldset disabled={placing} className="flex items-center justify-between gap-3 border border-black/10 bg-white/35 px-4 py-3 sm:px-6">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input className="size-4 shrink-0 accent-[#8d6745]" type="checkbox" name="rememberDetails" checked={rememberDetails} onChange={(event) => { if (event.target.checked) { setRememberDetails(true); setDetailsMessage(""); } else { forgetDetails(); } }} />
                <span>Save my details for next time.</span>
              </label>
              {hasSavedDetails ? <button aria-label="Clear saved details" className="shrink-0 text-xs underline underline-offset-4" type="button" onClick={forgetDetails}>Clear</button> : null}
              <p role="status" className="sr-only">{detailsMessage}</p>
            </fieldset>

            <section className="border border-black/10 bg-white/35 p-4 sm:p-6">
              <Title text="Credit / debit card" tone="gold" variant="small" />
              <div className="mt-5">
                {paymentConfig.enabled ? (
                  <PaymentElement
                    options={{
                      fields: { billingDetails: "never" },
                      wallets: {
                        applePay: "never",
                        googlePay: "never",
                        link: "never",
                      },
                    }}
                    onReady={() => setCardReady(true)}
                    onLoadError={() =>
                      setError(
                        "Unable to load secure payment. Please refresh and try again.",
                      )
                    }
                  />
                ) : (
                  <p className="text-sm text-black/55">
                    {paymentConfig.loading
                      ? "Loading secure payment…"
                      : "Online payment is currently unavailable. Please try again later."}
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="h-fit min-w-0 border border-black/10 bg-white/45 p-5 sm:p-6 lg:sticky lg:top-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Title text="Order summary" tone="gold" variant="small" />
              <Link
                className="shrink-0 py-2 text-sm text-[#735132] underline underline-offset-4 hover:text-[#1c1814] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745]"
                href="/cart"
              >
                Edit cart
              </Link>
            </div>
            <div className="mt-3 border-b border-black/10 lg:mt-5">
              <button
                aria-controls="checkout-order-items"
                aria-expanded={showOrderItems}
                className="flex min-h-12 w-full items-center justify-between gap-3 text-sm text-[#1c1814] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745] lg:hidden"
                onClick={() => setShowOrderItems((show) => !show)}
                type="button"
              >
                <span className="font-medium">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
                <span className="inline-flex shrink-0 items-center gap-2 text-xs">
                  {showOrderItems ? "Hide items" : "Show items"}
                  <ChevronDown
                    aria-hidden="true"
                    className={`size-4 transition-transform motion-reduce:transition-none ${showOrderItems ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              <ul
                aria-label="Order items"
                className={`${showOrderItems ? "block" : "hidden"} space-y-3 pb-5 pt-2 lg:block lg:pt-0`}
                id="checkout-order-items"
              >
                {cart.map((item) => {
                  const line = (quote?.lines ?? cartPricing?.lines)?.find(
                    (line) => line.slug === item.slug,
                  );
                  return (
                    <li
                      className="flex items-start gap-3 text-sm"
                      key={item.slug}
                    >
                      <Image
                        alt=""
                        className="size-12 shrink-0 border border-black/10 bg-white/60 object-contain p-1"
                        height={48}
                        sizes="48px"
                        src={line?.image || item.image}
                        width={48}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="wrap-break-word">{item.name}</p>
                        <div className="mt-1 flex items-start justify-between gap-3">
                          <span className="shrink-0 text-xs text-black/50">
                            Qty: {item.quantity}
                          </span>
                          <CartLinePrice
                            line={line}
                            fallbackPence={item.pricePence * item.quantity}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                aria-label="Coupon code"
                className="min-w-0 flex-1 border border-black/20 bg-white/50 px-3 py-2 text-sm uppercase outline-none"
                onChange={(event) => setCouponDraft(event.target.value)}
                placeholder="Coupon code"
                value={couponDraft}
              />
              <button
                className="shrink-0 border border-black px-3 text-xs font-semibold uppercase"
                disabled={placing}
                onClick={() => {
                  setError(undefined);
                  setCouponCode(couponDraft.trim().toUpperCase());
                }}
                type="button"
              >
                Apply
              </button>
            </div>
            <p className="mt-2 text-xs text-black/45">
              Coupons replace automatic sale offers.
            </p>
            {couponCode ? (
              <button
                className="mt-2 text-xs underline underline-offset-4"
                onClick={() => {
                  setCouponCode("");
                  setCouponDraft("");
                  setError(undefined);
                }}
                type="button"
              >
                Remove coupon {couponCode}
              </button>
            ) : null}
            {quote ? (
              <>
                <fieldset className="mt-5 space-y-2 border-t border-black/10 pt-4" disabled={placing}>
                  <legend className="text-sm font-medium">Delivery method</legend>
                  {quote.shippingMethods.map(method => <label key={method.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name="shippingMethod" checked={quote.shippingMethod.id === method.id} onChange={() => setShippingChoice({ basket, id: method.id })} />
                    <span className="flex-1">{method.name}{method.adjustment ? <span className="mt-0.5 block text-xs text-emerald-800">{method.adjustment.name}{method.adjustment.source === "RULE" ? " — applied automatically" : ""}</span> : null}</span><span>{method.adjustment ? <span className="mr-2 text-black/40 line-through">{money(method.basePricePence, quote.currency)}</span> : null}{method.pricePence ? money(method.pricePence, quote.currency) : "Free"}</span>
                  </label>)}
                </fieldset>
                {quote.shippingEstimated ? <p className="mt-2 text-xs text-black/50">Enter your delivery postcode to confirm available services and prices.</p> : null}
                {quote.freeQuantity ? (
                  <p className="mt-3 text-sm font-medium text-emerald-800">
                    {quote.freeQuantity}{" "}
                    {quote.freeQuantity === 1 ? "bottle" : "bottles"} free in
                    this order.
                  </p>
                ) : null}
                <dl className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-y border-black/10 py-4 text-sm">
                  <dt className="text-black/50">Subtotal</dt>
                  <dd className="text-right">
                    {money(quote.subtotalPence, quote.currency)}
                  </dd>
                  {quote.discountPence ? (
                    <>
                      <dt className="min-w-0 wrap-break-word text-black/50">
                        Discount
                        {quote.discount ? ` (${quote.discount.name})` : ""}
                      </dt>
                      <dd className="text-right text-emerald-700">
                        −{money(quote.discountPence, quote.currency)}
                      </dd>
                    </>
                  ) : null}
                  <dt className="text-black/50">Shipment</dt>
                  <dd className="text-right">
                    {quote.shippingPence
                      ? money(quote.shippingPence, quote.currency)
                      : "Free"}
                  </dd>
                  <dt className="pt-2 font-semibold">Total</dt>
                  <dd className="pt-2 text-right text-lg font-semibold">
                    {money(quote.totalPence, quote.currency)}
                  </dd>
                </dl>
              </>
            ) : (
              <div className="mt-5">
                <CartPriceSummary showCouponControl={false} />
                <p className="mt-3 flex items-center gap-2 text-sm text-black/45">
                  {quoting ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : null}
                  {quoting
                    ? "Calculating shipment…"
                    : "Shipment quote unavailable"}
                </p>
              </div>
            )}
            <p className="mt-5 text-xs leading-5 text-black/55">
              Your personal data will be used to process your order and support
              your experience, as described in our{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </p>
            {quote && quote.totalPence < 30 ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                Card payments require an order total of at least £0.30.
              </p>
            ) : null}
            <button
              className="mt-6 flex w-full items-center justify-center gap-2 bg-[#1c1814] px-5 py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white disabled:opacity-40"
              disabled={
                pricingLoading || Boolean(pricingError) ||
                !quote ||
                quote.totalPence < 30 ||
                placing ||
                quoting ||
                !paymentConfig.enabled ||
                !ready ||
                !cardReady
              }
              type="submit"
            >
              {placing ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <LockKeyhole size={15} />
              )}
              {placing ? "Placing order…" : "Place order"}
            </button>
            <p className="mt-3 text-center text-[10px] leading-4 text-black/40">
              Prices, stock, discounts, and shipment are verified again when the
              order is placed.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
