"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useCommerce } from "@/components/commerce/CommerceProvider";

interface Quote {
  subtotalPence: number; discountPence: number; shippingPence: number; taxPence: number; totalPence: number; currency: string;
  discount: { name: string; couponCode: string | null } | null;
  shippingMethod: { id: string; name: string };
  shippingMethods: { id: string; name: string; pricePence: number; estimatedDaysMin: number | null; estimatedDaysMax: number | null }[];
}
const input = "mt-1.5 w-full rounded-none border border-black/20 bg-white/50 px-3 py-2.5 text-sm outline-none focus:border-[#8d6745]";
function money(pence: number, currency = "GBP") { return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100); }

export default function CheckoutPage() {
  const { cart, clearCart } = useCommerce();
  const [countryCode, setCountryCode] = useState("GB");
  const [couponCode, setCouponCode] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState<string>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string>();
  const [quoting, setQuoting] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [confirmation, setConfirmation] = useState<{ orderNumber: string; totalPence: number; currency: string }>();
  const idempotencyKey = useRef<string | null>(null);

  const cartSignature = cart.map((item) => `${item.slug}:${item.quantity}`).join("|");
  useEffect(() => {
    if (!cartSignature) return;
    let cancelled = false;
    const load = async () => {
      setQuoting(true); setError(undefined);
      try {
        const response = await fetch("/api/commerce/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart.map((item) => ({ slug: item.slug, quantity: item.quantity })), countryCode }) });
        const data = await response.json() as Quote & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to calculate checkout.");
        if (!cancelled) { setQuote(data); setShippingMethodId(data.shippingMethod.id); }
      } catch (reason) { if (!cancelled) { setQuote(null); setError(reason instanceof Error ? reason.message : "Unable to calculate checkout."); } }
      finally { if (!cancelled) setQuoting(false); }
    };
    void load();
    return () => { cancelled = true; };
    // cartSignature deliberately represents the serializable cart dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature, countryCode]);

  async function refreshQuote(nextShippingMethodId = shippingMethodId) {
    if (!cart.length) return;
    setQuoting(true); setError(undefined);
    try {
      const response = await fetch("/api/commerce/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart.map((item) => ({ slug: item.slug, quantity: item.quantity })), countryCode, shippingMethodId: nextShippingMethodId, couponCode: couponCode.trim().toUpperCase() || undefined }) });
      const data = await response.json() as Quote & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to calculate checkout.");
      setQuote(data); setShippingMethodId(data.shippingMethod.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to calculate checkout."); }
    finally { setQuoting(false); }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!quote || !shippingMethodId || placing) return;
    const formData = new FormData(event.currentTarget);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const name = String(formData.get("name") ?? "");
    const payload = {
      items: cart.map((item) => ({ slug: item.slug, quantity: item.quantity })), countryCode, shippingMethodId,
      couponCode: couponCode.trim().toUpperCase() || undefined, customerEmail: email, idempotencyKey: idempotencyKey.current,
      customer: { name, email, phone, notes: String(formData.get("notes") ?? "") },
      shippingAddress: { fullName: name, company: String(formData.get("company") ?? ""), line1: String(formData.get("line1") ?? ""), line2: String(formData.get("line2") ?? ""), city: String(formData.get("city") ?? ""), region: String(formData.get("region") ?? ""), postalCode: String(formData.get("postalCode") ?? ""), countryCode, phone },
      paymentMethod: formData.get("paymentMethod"),
    };
    setPlacing(true); setError(undefined);
    try {
      const response = await fetch("/api/commerce/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { orderNumber?: string; totalPence?: number; currency?: string; error?: string };
      if (!response.ok || !data.orderNumber || data.totalPence === undefined || !data.currency) throw new Error(data.error ?? "Unable to place the order.");
      setConfirmation({ orderNumber: data.orderNumber, totalPence: data.totalPence, currency: data.currency }); clearCart();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to place the order."); }
    finally { setPlacing(false); }
  }

  if (confirmation) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-16 pt-40 text-[#1c1814] sm:pb-20 sm:pt-44">
        <div className="max-w-lg text-center">
          <CheckCircle2 className="mx-auto text-emerald-700" size={54} />
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">Order received</p>
          <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Thank you</h1>
          <p className="mt-5 leading-7 text-black/55">
            Your order <strong className="break-all text-black">{confirmation.orderNumber}</strong> has been created for {money(confirmation.totalPence, confirmation.currency)}. We’ll contact you with payment and delivery updates.
          </p>
          <Link className="mt-8 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" href="/">Return home</Link>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-16 pt-40 text-[#1c1814] sm:pb-20 sm:pt-44">
        <div className="text-center">
          <h1 className="font-heading text-4xl sm:text-5xl">Your cart is empty</h1>
          <Link className="mt-7 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" href="/recreations">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3eee5] pb-16 pt-40 text-[#1c1814] sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">Secure order</p>
        <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Checkout</h1>
        {error ? <div role="alert" className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1fr_360px]" onSubmit={submitOrder}>
          <div className="space-y-6">
            <section className="grid gap-5 border border-black/10 bg-white/35 p-4 sm:grid-cols-2 sm:p-6">
              <h2 className="font-heading text-2xl sm:col-span-2">Contact and delivery</h2>
              <label className="text-sm">Full name<input className={input} name="name" required /></label>
              <label className="text-sm">Email<input className={input} name="email" required type="email" /></label>
              <label className="text-sm">Phone<input className={input} name="phone" /></label>
              <label className="text-sm">Company<input className={input} name="company" /></label>
              <label className="text-sm sm:col-span-2">Address line 1<input className={input} name="line1" required /></label>
              <label className="text-sm sm:col-span-2">Address line 2<input className={input} name="line2" /></label>
              <label className="text-sm">City<input className={input} name="city" required /></label>
              <label className="text-sm">Region / county<input className={input} name="region" /></label>
              <label className="text-sm">Postcode<input className={input} name="postalCode" required /></label>
              <label className="text-sm">
                Country
                <select className={input} onChange={(event) => setCountryCode(event.target.value)} value={countryCode}>
                  <option value="GB">United Kingdom</option>
                  <option value="PK">Pakistan</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="IE">Ireland</option>
                  <option value="US">United States</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">Order notes<textarea className={input} maxLength={2000} name="notes" rows={3} /></label>
            </section>

            <section className="border border-black/10 bg-white/35 p-4 sm:p-6">
              <h2 className="font-heading text-2xl">Payment method</h2>
              <label className="mt-4 flex items-start gap-3 border border-black/15 p-4">
                <input defaultChecked name="paymentMethod" type="radio" value="CASH_ON_DELIVERY" />
                <span><strong className="block text-sm">Cash on delivery</strong><span className="mt-1 block text-xs text-black/45">Pay when your order arrives.</span></span>
              </label>
              <label className="mt-3 flex items-start gap-3 border border-black/15 p-4">
                <input name="paymentMethod" type="radio" value="BANK_TRANSFER" />
                <span><strong className="block text-sm">Bank transfer</strong><span className="mt-1 block text-xs text-black/45">Transfer instructions will be sent after ordering.</span></span>
              </label>
            </section>
          </div>

          <aside className="h-fit min-w-0 border border-black/10 bg-white/45 p-5 sm:p-6 lg:sticky lg:top-8">
            <h2 className="font-heading text-2xl">Order summary</h2>
            <div className="mt-5 space-y-3 border-b border-black/10 pb-5">
              {cart.map((item) => (
                <div className="flex items-start justify-between gap-4 text-sm" key={item.slug}>
                  <span className="min-w-0 break-words">{item.name} × {item.quantity}</span>
                  <span className="shrink-0">{money(item.pricePence * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input aria-label="Coupon code" className="min-w-0 flex-1 border border-black/20 bg-white/50 px-3 py-2 text-sm uppercase outline-none" onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon code" value={couponCode} />
              <button className="shrink-0 border border-black px-3 text-xs font-semibold uppercase" disabled={quoting} onClick={() => void refreshQuote()} type="button">Apply</button>
            </div>
            {quote ? (
              <>
                <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-black/50">
                  Delivery method
                  <select className="mt-2 w-full border border-black/20 bg-white px-3 py-2 text-sm text-black" onChange={(event) => { setShippingMethodId(event.target.value); void refreshQuote(event.target.value); }} value={shippingMethodId}>
                    {quote.shippingMethods.map((method) => <option key={method.id} value={method.id}>{method.name} — {money(method.pricePence)}</option>)}
                  </select>
                </label>
                <dl className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-y border-black/10 py-4 text-sm">
                  <dt className="text-black/50">Subtotal</dt><dd className="text-right">{money(quote.subtotalPence, quote.currency)}</dd>
                  {quote.discountPence ? <><dt className="min-w-0 break-words text-black/50">Discount{quote.discount ? ` (${quote.discount.name})` : ""}</dt><dd className="text-right text-emerald-700">−{money(quote.discountPence, quote.currency)}</dd></> : null}
                  <dt className="text-black/50">Delivery</dt><dd className="text-right">{quote.shippingPence ? money(quote.shippingPence, quote.currency) : "Free"}</dd>
                  <dt className="pt-2 font-semibold">Total</dt><dd className="pt-2 text-right text-lg font-semibold">{money(quote.totalPence, quote.currency)}</dd>
                </dl>
              </>
            ) : (
              <div className="mt-5 flex items-center gap-2 text-sm text-black/45">
                {quoting ? <LoaderCircle className="animate-spin" size={16} /> : null}
                {quoting ? "Calculating prices…" : "Delivery quote unavailable"}
              </div>
            )}
            <button className="mt-6 flex w-full items-center justify-center gap-2 bg-[#1c1814] px-5 py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white disabled:opacity-40" disabled={!quote || placing || quoting} type="submit">
              {placing ? <LoaderCircle className="animate-spin" size={16} /> : <LockKeyhole size={15} />}
              {placing ? "Placing order…" : "Place order"}
            </button>
            <p className="mt-3 text-center text-[10px] leading-4 text-black/40">Prices, stock, discounts, and delivery are verified again when the order is placed.</p>
          </aside>
        </form>
      </div>
    </div>
  );
}
