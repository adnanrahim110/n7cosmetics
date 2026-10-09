"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useCommerce } from "./CommerceProvider";
import Title from "../ui/Title";
import { sendMetaBrowserEvent } from "@/lib/meta/client";
import type { MetaBrowserEvent } from "@/lib/meta/shared";
import { CHECKOUT_ATTEMPT_KEY, readCheckoutAttempt } from "@/lib/payments/checkout-attempt";

interface Receipt { orderNumber: string; totalPence: number; currency: string; status: "paid" | "pending" | "failed" | "expired"; metaPurchase?: MetaBrowserEvent }
export default function PaymentConfirmation({ checkoutKey }: { checkoutKey: string }) {
  const { clearCart, hydrated, setReservationKey } = useCommerce();
  const [receipt, setReceipt] = useState<Receipt>();
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [returnPath, setReturnPath] = useState("/checkout");
  useEffect(() => {
    if (!receipt?.metaPurchase) return;
    const send = () => { if (receipt.metaPurchase) void sendMetaBrowserEvent(receipt.metaPurchase); };
    send(); window.addEventListener("n7:meta-ready", send);
    return () => window.removeEventListener("n7:meta-ready", send);
  }, [receipt]);
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    const startedAt = Date.now();
    // Keep the guest receipt credential out of analytics URLs. Session storage
    // preserves receipt refresh in this tab; blocked storage leaves the URL intact
    // and browser tracking deliberately skips it.
    let effectiveKey = checkoutKey;
    try {
      effectiveKey ||= sessionStorage.getItem("n7-receipt-key") || "";
      if (effectiveKey) {
        sessionStorage.setItem("n7-receipt-key", effectiveKey);
        const url = new URL(location.href);
        for (const key of ["key", "payment_intent", "payment_intent_client_secret", "redirect_status"]) url.searchParams.delete(key);
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
      }
    } catch { /* CAPI still records a consented, verified purchase without the Pixel. */ }
    function schedule() {
      if (!controller.signal.aborted) timer = setTimeout(check, count < 10 ? 3000 : count < 30 ? 10000 : 30000);
    }
    async function check() {
      count++;
      try {
        const response = await fetch("/api/payments/stripe/status", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: effectiveKey }), cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
        });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if ([400, 403, 404].includes(response.status)) { setMessage(data.error || "Unable to find this checkout."); return; }
        if (!response.ok) throw new Error(data.error || "Unable to check payment.");
        setReceipt(data);
        setMessage("");
        try {
          const attempt = readCheckoutAttempt(sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY));
          if (attempt?.key === effectiveKey) {
            setReturnPath(attempt.returnPath);
            if (data.status === "paid") {
              if (attempt.preserveCart) setReservationKey(undefined);
              else clearCart();
              sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
            }
          }
        } catch { /* Browser storage must not interrupt a verified receipt. */ }
        if (data.status === "pending") {
          if (Date.now() - startedAt > 60000) setMessage("Your payment is still being confirmed. We’ll keep checking automatically; please don’t pay again.");
          schedule();
        }
      } catch {
        if (!controller.signal.aborted) {
          setMessage("We couldn’t confirm your payment yet. We’ll keep checking automatically; please don’t pay again.");
          schedule();
        }
      }
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [checkoutKey, clearCart, hydrated, retry, setReservationKey]);
  const paid = receipt?.status === "paid";
  const unsuccessful = receipt?.status === "failed" || receipt?.status === "expired";
  return <div className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-16 pt-40 text-[#1c1814]">
    <div className="max-w-lg text-center" aria-live="polite">
      {paid ? <CheckCircle2 className="mx-auto text-emerald-700" size={54} /> : !unsuccessful && !message ? <LoaderCircle className="mx-auto animate-spin" size={40} /> : null}
      <Title as="h1" className="mt-5" text={paid ? "Thank you" : unsuccessful ? "Payment not completed" : "Confirming payment"} tone="gold" />
      <p className="mt-5 leading-7 text-black/60">{paid ? `Payment received for order ${receipt.orderNumber}: ${new Intl.NumberFormat("en-GB", { style: "currency", currency: receipt.currency }).format(receipt.totalPence / 100)}. Your confirmation will arrive by email.` : unsuccessful ? returnPath === "/checkout" ? "Your cart is saved. Return to checkout to try again." : "Return to the product page to try again." : message || "Please wait while we confirm your payment."}</p>
      {receipt ? <p className="mt-3 text-sm text-black/50">Order reference: {receipt.orderNumber}</p> : null}
      {!paid && !unsuccessful && message ? <button className="mt-6 block w-full text-sm underline underline-offset-4" onClick={() => setRetry((value) => value + 1)} type="button">Check again</button> : null}
      <Link className="mt-8 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" href={unsuccessful ? returnPath : "/"}>{unsuccessful ? returnPath === "/checkout" ? "Return to checkout" : "Return to product" : "Return home"}</Link>
    </div>
  </div>;
}
