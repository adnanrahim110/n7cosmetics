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
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    async function check() {
      try {
        const response = await fetch(`/api/payments/stripe/status?key=${encodeURIComponent(checkoutKey)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to check payment.");
        if (controller.signal.aborted) return;
        setReceipt(data);
        if (data.status === "paid") {
          const attempt = JSON.parse(sessionStorage.getItem("n7-stripe-attempt") || "null");
          if (attempt?.key === checkoutKey) { clearCart(); sessionStorage.removeItem("n7-stripe-attempt"); }
        } else if (data.status === "pending" && count++ < 30) timer = setTimeout(check, 2000);
        else if (data.status === "pending") setMessage("Your payment is still being confirmed. Refresh this page shortly; please don’t pay again.");
      } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Unable to check payment."); }
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [checkoutKey, clearCart, hydrated]);
  const paid = receipt?.status === "paid";
  const unsuccessful = receipt?.status === "failed" || receipt?.status === "expired";
  return <div className="grid min-h-screen place-items-center bg-[#f3eee5] px-5 pb-16 pt-40 text-[#1c1814]">
    <div className="max-w-lg text-center" aria-live="polite">
      {paid ? <CheckCircle2 className="mx-auto text-emerald-700" size={54} /> : !unsuccessful && !message ? <LoaderCircle className="mx-auto animate-spin" size={40} /> : null}
      <Title as="h1" className="mt-5" text={paid ? "Thank you" : unsuccessful ? "Payment not completed" : "Confirming payment"} tone="gold" />
      <p className="mt-5 leading-7 text-black/60">{paid ? `Payment received for order ${receipt.orderNumber}: ${new Intl.NumberFormat("en-GB", { style: "currency", currency: receipt.currency }).format(receipt.totalPence / 100)}. Your confirmation will arrive by email.` : unsuccessful ? "Your cart is saved. Return to checkout to try again." : message || "Please wait while we confirm your payment."}</p>
      {receipt ? <p className="mt-3 text-sm text-black/50">Order reference: {receipt.orderNumber}</p> : null}
      <Link className="mt-8 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" href={unsuccessful ? "/checkout" : "/"}>{unsuccessful ? "Return to checkout" : "Return home"}</Link>
    </div>
  </div>;
}
