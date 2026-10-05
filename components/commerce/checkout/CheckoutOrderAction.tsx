import { LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CheckoutPaymentMethod } from "./CheckoutWalletBrand";
import { checkoutFocus } from "./styles";

interface CheckoutOrderActionProps {
  disabled: boolean;
  placing: boolean;
  method: CheckoutPaymentMethod;
  onWalletContinue: () => void;
}

export default function CheckoutOrderAction({ disabled, placing, method, onWalletContinue }: CheckoutOrderActionProps) {
  const walletName = method === "applePay" ? "Apple Pay" : "Google Pay";
  return (
    <div>
      <button className={cn("flex min-h-14 w-full items-center justify-center gap-3 rounded bg-[#9c6d1e] px-4 py-3 text-base font-semibold uppercase tracking-wide text-white hover:bg-[#8c6017] active:bg-[#754d10] disabled:cursor-not-allowed disabled:opacity-50", checkoutFocus)} disabled={disabled} onClick={method !== "card" ? onWalletContinue : undefined} type={method === "card" ? "submit" : "button"}>
        {placing ? <LoaderCircle aria-hidden="true" className="size-5 shrink-0 animate-spin motion-reduce:animate-none" /> : <LockKeyhole aria-hidden="true" className="size-5 shrink-0" />}
        {placing ? "Placing order…" : method === "card" ? "Place order" : `Continue with ${walletName}`}
      </button>
      <p className="mt-3 text-center text-[10px] leading-4 text-[#625f59]">By placing your order, you agree to our <Link className={cn("rounded text-[#805915] underline underline-offset-2 hover:text-black", checkoutFocus)} href="/shipping-returns">Shipping &amp; Returns policy</Link> and <Link className={cn("rounded text-[#805915] underline underline-offset-2 hover:text-black", checkoutFocus)} href="/privacy">Privacy Policy</Link>.</p>
    </div>
  );
}
