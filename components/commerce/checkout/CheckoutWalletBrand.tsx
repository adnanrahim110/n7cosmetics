import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { cn } from "@/lib/cn";

export type CheckoutPaymentMethod = "card" | "applePay" | "googlePay";

export default function CheckoutWalletBrand({ wallet, className }: { wallet: Exclude<CheckoutPaymentMethod, "card">; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 font-medium", className)}>
      {wallet === "applePay" ? <><FaApple aria-hidden="true" className="size-5" /><span>Apple Pay</span></> : <><FcGoogle aria-hidden="true" className="size-5" /><span>Google Pay</span></>}
    </span>
  );
}
