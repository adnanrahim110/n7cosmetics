"use client";

import { useElements } from "@stripe/react-stripe-js";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { checkoutAddressFromForm, checkoutFieldErrors, checkoutFormSchema, CheckoutValidationError, readCheckoutFieldErrors, type CheckoutFieldErrors, type CheckoutFormField } from "@/lib/commerce/checkout-validation";
import { clearSavedCheckoutDetails, emptyCheckoutAddress, loadSavedCheckoutDetails, saveCheckoutDetails, walletCheckoutDetails, type CheckoutAddressDetails, type SavedCheckoutDetails } from "@/lib/commerce/saved-checkout";
import { normalizePostcode } from "@/lib/commerce/shipping";
import type { CheckoutInput } from "@/lib/commerce/validation";
import { cn } from "@/lib/cn";
import { useMetaCheckoutMatching } from "@/components/meta/useMetaCheckoutMatching";
import { useCommerce } from "../CommerceProvider";
import type { WalletAvailability } from "../ExpressPayment";
import StripeProvider, { usePaymentConfig } from "../StripeProvider";
import { useStripePayment } from "../useStripePayment";
import CheckoutAssurances from "./CheckoutAssurances";
import CheckoutBillingSection from "./CheckoutBillingSection";
import CheckoutContactSection from "./CheckoutContactSection";
import CheckoutDeliverySection from "./CheckoutDeliverySection";
import CheckoutExpressSection from "./CheckoutExpressSection";
import CheckoutOrderSummary from "./CheckoutOrderSummary";
import CheckoutOrderAction from "./CheckoutOrderAction";
import CheckoutPaymentSection from "./CheckoutPaymentSection";
import CheckoutValidationProvider from "./CheckoutValidationProvider";
import type { CheckoutPaymentMethod } from "./CheckoutWalletBrand";
import { focusCheckoutElement } from "./checkout-focus";
import { checkoutFocus, checkoutPaymentAppearance } from "./styles";

export default function CheckoutForm({ heading }: { heading: ReactNode }) {
  return <StripeProvider appearance={checkoutPaymentAppearance}><CheckoutFields heading={heading} /></StripeProvider>;
}

function CheckoutFields({ heading }: { heading: ReactNode }) {
  const { cart, hydrated, couponCode, setCouponCode, pricingError, pricingLoading, reservationKey } = useCommerce();
  const elements = useElements();
  const paymentConfig = usePaymentConfig();
  const { pay, ready } = useStripePayment();
  const submissionLock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [differentShipping, setDifferentShipping] = useState(false);
  const [billingDetails, setBillingDetails] = useState(emptyCheckoutAddress);
  const [shippingDetails, setShippingDetails] = useState(emptyCheckoutAddress);
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [touchedFields, setTouchedFields] = useState<ReadonlySet<string>>(() => new Set());
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<CheckoutFieldErrors>({});
  const [marketingOptOut, setMarketingOptOut] = useState(false);
  const [rememberDetails, setRememberDetails] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardValidationError, setCardValidationError] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("card");
  const [walletAvailability, setWalletAvailability] = useState<WalletAvailability | null>(null);
  const [quoteState, setQuoteState] = useState<{ key: string; data?: CheckoutQuote; error?: string; code?: string } | null>(null);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [error, setError] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [shippingChoice, setShippingChoice] = useState<{ basket: string; id: string } | null>(null);
  const [allItemsExpanded, setAllItemsExpanded] = useState(false);
  const itemsExpanded = cart.length > 3 && allItemsExpanded;
  const countryCode = "GB";
  useMetaCheckoutMatching({
    email: contactEmail, phone: billingDetails.phone,
    fullName: billingDetails.firstName.trim() && billingDetails.lastName.trim() ? `${billingDetails.firstName} ${billingDetails.lastName}` : undefined,
    city: billingDetails.city, region: billingDetails.region, postalCode: billingDetails.postalCode, countryCode,
  });
  const deliveryAddress = differentShipping ? shippingDetails : billingDetails;
  const postalCode = normalizePostcode(deliveryAddress.postalCode);
  const basket = JSON.stringify({ postalCode });
  const selectedShippingId = shippingChoice?.basket === basket ? shippingChoice.id : undefined;
  const quoteRequest = JSON.stringify({
    items: cart.map(({ slug, quantity }) => ({ slug, quantity })), countryCode, postalCode,
    couponCode: couponCode || undefined, shippingMethodId: selectedShippingId, reservationKey,
  });
  const hasCart = cart.length > 0;
  const currentQuote = quoteState?.key === quoteRequest ? quoteState : null;
  // Keep the active Elements mounted while Stripe reserves stock and confirms payment.
  const quote = currentQuote?.data ?? (placing ? quoteState?.data : null) ?? null;
  const quoting = hasCart && !currentQuote && !placing;
  const displayError = error ?? pricingError ?? currentQuote?.error;
  const formResult = checkoutFormSchema.safeParse({
    email: contactEmail, billingAddress: billingDetails,
    shippingAddress: differentShipping ? shippingDetails : undefined, notes,
  });
  const clientErrors = formResult.success ? {} : checkoutFieldErrors(formResult.error.issues);
  const visibleErrors = {
    ...readCheckoutFieldErrors(Object.fromEntries(Object.entries(clientErrors).filter(([field]) => validationAttempted || touchedFields.has(field)))),
    ...serverErrors,
  };
  const checkoutBlocked = pricingLoading || Boolean(pricingError) || !quote || quote.totalPence < 30 || placing || quoting || !paymentConfig.enabled || !ready;
  const orderDisabled = placing || (paymentMethod !== "card" && (checkoutBlocked || !walletAvailability?.[paymentMethod]));
  const couponError = currentQuote?.code === "INVALID_COUPON" || currentQuote?.code === "COUPON_LIMIT" ? currentQuote.error : undefined;

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
        setDetailsMessage("Your saved details have been filled in. You can edit them below.");
      } catch { /* Checkout also works when local storage is blocked. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (quote) elements?.update({ amount: Math.max(30, quote.totalPence) });
  }, [elements, quote]);

  useEffect(() => {
    if (!hasCart || !hydrated) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/commerce/quote", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: quoteRequest,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
        });
        const data: CheckoutQuote & { error?: string; code?: string } = await response.json();
        if (!response.ok && data.code === "DELIVERY_UNAVAILABLE" && selectedShippingId && !controller.signal.aborted) {
          setShippingChoice(null);
          return;
        }
        if (!response.ok) {
          if (!controller.signal.aborted) setQuoteState({ key: quoteRequest, error: data.error ?? "Unable to calculate checkout.", code: data.code });
          return;
        }
        if (!controller.signal.aborted) setQuoteState({ key: quoteRequest, data });
      } catch (reason) {
        if (!controller.signal.aborted) setQuoteState({ key: quoteRequest, error: reason instanceof Error ? reason.message : "Unable to calculate checkout." });
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [hasCart, hydrated, quoteRequest, selectedShippingId, quoteRetry, pricingError]);

  function forgetDetails() {
    setRememberDetails(false);
    try {
      if (clearSavedCheckoutDetails(window.localStorage)) {
        setHasSavedDetails(false);
        setDetailsMessage("Saved details cleared from this device.");
        return;
      }
    } catch { /* Explain how to remove saved data if storage is blocked. */ }
    setDetailsMessage("Your browser could not clear your saved details. Clear this website’s data in your browser settings to remove them.");
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

  function changeDeliveryAddress(address: CheckoutAddressDetails) {
    if (differentShipping) setShippingDetails(address);
    else setBillingDetails(address);
  }

  function changeDifferentBilling(different: boolean) {
    if (different) setShippingDetails({ ...billingDetails });
    else setBillingDetails({ ...shippingDetails });
    setDifferentShipping(different);
    setServerErrors({});
  }

  function onFieldBlur(field: CheckoutFormField) {
    setTouchedFields((current) => new Set([...current, field]));
  }

  function onFieldChange(field: CheckoutFormField) {
    if (serverErrors[field]) setError(undefined);
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      // Both server addresses contain the same details when billing is shared.
      if (!differentShipping && field.startsWith("billing.")) {
        return readCheckoutFieldErrors(Object.fromEntries(Object.entries(next).filter(([key]) => key !== field.replace("billing.", "shipping."))));
      }
      return next;
    });
  }

  function focusFirstInvalidField() {
    window.requestAnimationFrame(() => {
      focusCheckoutElement(formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]'));
    });
  }

  function focusPaymentField() {
    window.requestAnimationFrame(() => focusCheckoutElement(document.getElementById("checkout-card-fields")));
  }

  function focusCheckoutError() {
    window.requestAnimationFrame(() => focusCheckoutElement(document.getElementById("checkout-form-error")));
  }

  function continueWithWallet() {
    if (paymentMethod === "card") return;
    focusCheckoutElement(document.getElementById(`checkout-${paymentMethod}-payment`));
  }

  function retryQuote() {
    setError(undefined);
    setQuoteState(null);
    setQuoteRetry((value) => value + 1);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current || placing) return;
    if (paymentMethod !== "card") { continueWithWallet(); return; }
    if (!formResult.success) {
      setValidationAttempted(true);
      focusFirstInvalidField();
      return;
    }
    if (Object.keys(serverErrors).length > 0 || couponError) {
      focusFirstInvalidField();
      return;
    }
    if (!elements || !ready || !cardReady || !paymentConfig.enabled) {
      setCardValidationError(paymentConfig.loading || (paymentConfig.enabled && !cardReady) ? "Secure payment is still loading. Please try again in a moment." : "Secure payment is unavailable. Please refresh and try again.");
      focusPaymentField();
      return;
    }
    if (!quote || checkoutBlocked) {
      setError(quoting || pricingLoading ? "We’re updating your order total. Please try again in a moment." : pricingError || currentQuote?.error || "Your order total is unavailable. Please check your order summary and try again.");
      focusCheckoutError();
      return;
    }
    submissionLock.current = true;
    const email = formResult.data.email;
    const billingAddress = checkoutAddressFromForm(formResult.data.billingAddress);
    const payload: Omit<CheckoutInput, "idempotencyKey"> = {
      items: cart.map(({ slug, quantity }) => ({ slug, quantity })), countryCode,
      shippingMethodId: quote.shippingMethod.id, couponCode: quote.discount?.couponCode ?? undefined,
      expectedTotalPence: quote.totalPence, customerEmail: email,
      customer: { name: billingAddress.fullName, email, phone: billingAddress.phone, notes: formResult.data.notes },
      billingAddress, shippingAddress: formResult.data.shippingAddress ? checkoutAddressFromForm(formResult.data.shippingAddress) : billingAddress,
      marketingOptOut, paymentMethod: "STRIPE",
    };
    rememberCheckout({ version: 1, email, billingAddress: billingDetails, shippingAddress: differentShipping ? shippingDetails : billingDetails, differentShipping });
    setPlacing(true);
    setError(undefined);
    setCardValidationError(undefined);
    try {
      if (!cardComplete) {
        const { error: paymentError } = await elements.submit();
        if (paymentError) {
          setCardValidationError(paymentError.message || "Check your card number, expiry date and security code.");
          focusPaymentField();
          return;
        }
      }
      await pay(payload);
    }
    catch (reason) {
      if (reason instanceof CheckoutValidationError) {
        setServerErrors(reason.fieldErrors);
        setValidationAttempted(true);
        focusFirstInvalidField();
      } else focusCheckoutError();
      setError(reason instanceof Error ? reason.message : "Unable to place your order. Please try again.");
    }
    finally { submissionLock.current = false; setPlacing(false); }
  }

  if (!hydrated) return <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-[#625f59]" role="status"><LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Loading your checkout…</div>;

  if (!hasCart) return (
    <section className="grid min-h-96 place-items-center py-12 text-center">
      <div>
        <ShoppingBag aria-hidden="true" className="mx-auto mb-5 size-10 text-[#a67520]" strokeWidth={1.5} />
        <h1 className="font-heading text-3xl font-semibold tracking-normal text-[#111110] sm:text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-sm text-[#625f59]">Find your next favourite fragrance to get started.</p>
        <Link className={cn("mt-6 inline-flex min-h-11 items-center justify-center rounded bg-[#141413] px-6 py-3 text-sm font-semibold text-white hover:bg-[#35332f]", checkoutFocus)} href="/recreations">Continue shopping</Link>
      </div>
    </section>
  );

  return (
    <CheckoutValidationProvider errors={visibleErrors} onFieldBlur={onFieldBlur} onFieldChange={onFieldChange}>
    <form aria-busy={placing} className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] xl:gap-7" noValidate onSubmit={submitOrder} ref={formRef}>
      <section aria-label="Checkout information" className="min-w-0">
        {heading}
        {displayError ? <div role="alert" className={cn("mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800", checkoutFocus)} id="checkout-form-error" tabIndex={-1}>{displayError}</div> : null}
        <div className="space-y-4">
          <CheckoutExpressSection quote={quote ?? quoteState?.data ?? null} available={walletAvailability} blocked={pricingLoading || Boolean(pricingError) || quoting} busy={placing} marketingOptOut={marketingOptOut} onAvailabilityChange={setWalletAvailability} onCheckoutDetails={(input) => rememberCheckout(walletCheckoutDetails(input))} onBusyChange={setPlacing} />
          <CheckoutContactSection email={contactEmail} onEmailChange={setContactEmail} marketingOptOut={marketingOptOut} onMarketingOptOutChange={setMarketingOptOut} disabled={placing} />
          <CheckoutDeliverySection address={deliveryAddress} prefix={differentShipping ? "shipping" : "billing"} onAddressChange={changeDeliveryAddress} differentBilling={differentShipping} onDifferentBillingChange={changeDifferentBilling} rememberDetails={rememberDetails} onRememberDetailsChange={(remember) => { if (remember) { setRememberDetails(true); setDetailsMessage(""); } else forgetDetails(); }} hasSavedDetails={hasSavedDetails} onForgetDetails={forgetDetails} detailsMessage={detailsMessage} notes={notes} onNotesChange={setNotes} disabled={placing} />
          {differentShipping ? <CheckoutBillingSection address={billingDetails} onAddressChange={setBillingDetails} disabled={placing} /> : null}
        </div>
      </section>
      <aside aria-label="Order summary and payment" className={cn("min-w-0 space-y-5 lg:pt-2", !itemsExpanded && "lg:sticky lg:top-40")}>
        <CheckoutOrderSummary quote={quote} quoting={quoting} placing={placing} couponError={couponError} itemsExpanded={itemsExpanded} onItemsExpandedChange={setAllItemsExpanded} onShippingChange={(id) => { setError(undefined); setShippingChoice({ basket, id }); }} onCouponChange={(code) => { setError(undefined); setCouponCode(code); }} onRetry={retryQuote} />
        <CheckoutAssurances quote={quote} />
        <CheckoutPaymentSection method={paymentMethod} onMethodChange={setPaymentMethod} available={walletAvailability} quote={quote} disabled={placing} marketingOptOut={marketingOptOut} cardError={cardValidationError} onCardReady={() => { setCardReady(true); setCardValidationError(undefined); }} onCardCompleteChange={(complete) => { setCardComplete(complete); if (complete) setCardValidationError(undefined); }} onCardError={() => { setCardReady(false); setCardComplete(false); setCardValidationError("Unable to load secure payment. Please refresh and try again."); }} onCheckoutDetails={(input) => rememberCheckout(walletCheckoutDetails(input))} onBusyChange={setPlacing} />
        <CheckoutOrderAction disabled={orderDisabled} placing={placing} method={paymentMethod} onWalletContinue={continueWithWallet} />
      </aside>
    </form>
    </CheckoutValidationProvider>
  );
}
