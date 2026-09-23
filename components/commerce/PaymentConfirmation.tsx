"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useCommerce } from "./CommerceProvider";
import Title from "../ui/Title";

interface Receipt { orderNumber: string; totalPence: number; currency: string; status: "paid" | "pending" | "failed" | "expired" }
export default function PaymentConfirmation({ checkoutKey }: { checkoutKey: string }) {
  const { clearCart, hydrated } = useCommerce();
  const [receipt, setReceipt] = useState<Receipt>();
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    const startedAt = Date.now();
    function schedule() {
      if (!controller.signal.aborted) timer = setTimeout(check, count < 10 ? 3000 : count < 30 ? 10000 : 30000);
    }
    async function check() {
      count++;
      try {
        const response = await fetch("/api/payments/stripe/status", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: checkoutKey }), cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
        });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if ([400, 403, 404].includes(response.status)) { setMessage(data.error || "Unable to find this checkout."); return; }
        if (!response.ok) throw new Error(data.error || "Unable to check payment.");
        setReceipt(data);
        setMessage("");
        if (data.status === "paid") {
          try {
            const attempt = JSON.parse(sessionStorage.getItem("n7-stripe-attempt") || "null");
            if (attempt?.key === checkoutKey) { clearCart(); sessionStorage.removeItem("n7-stripe-attempt"); }
          } catch { /* Browser storage must not interrupt a verified receipt. */ }
        } else if (data.status === "pending") {
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
  }, [checkoutKey, clearCart, hydrated, retry]);
  const paid = receipt?.status === "paid";
  const unsuccessful = receipt?.status === "failed" || receipt?.status === "expired";
  return <div className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-16 pt-40 text-[#1c1814]">
    <div className="max-w-lg text-center" aria-live="polite">
      {paid ? <CheckCircle2 className="mx-auto text-emerald-700" size={54} /> : !unsuccessful && !message ? <LoaderCircle className="mx-auto animate-spin" size={40} /> : null}
      <Title as="h1" className="mt-5" text={paid ? "Thank you" : unsuccessful ? "Payment not completed" : "Confirming payment"} tone="gold" />
      <p className="mt-5 leading-7 text-black/60">{paid ? `Payment received for order ${receipt.orderNumber}: ${new Intl.NumberFormat("en-GB", { style: "currency", currency: receipt.currency }).format(receipt.totalPence / 100)}. Your confirmation will arrive by email.` : unsuccessful ? "Your cart is saved. Return to checkout to try again." : message || "Please wait while we confirm your payment."}</p>
      {receipt ? <p className="mt-3 text-sm text-black/50">Order reference: {receipt.orderNumber}</p> : null}
      {!paid && !unsuccessful && message ? <button className="mt-6 block w-full text-sm underline underline-offset-4" onClick={() => setRetry((value) => value + 1)} type="button">Check again</button> : null}
      <Link className="mt-8 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" href={unsuccessful ? "/checkout" : "/"}>{unsuccessful ? "Return to checkout" : "Return home"}</Link>
    </div>
  </div>;
}
