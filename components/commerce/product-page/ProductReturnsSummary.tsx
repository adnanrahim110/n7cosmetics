import Link from "next/link";
import { cn } from "@/lib/cn";

export default function ProductReturnsSummary({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 text-xs leading-5 text-stone-600", className)}>
      <h3 className="font-body font-semibold tracking-normal text-stone-900">Returns</h3>
      <p>
        Unopened and unused items can be returned within 30 days of delivery.
        For hygiene reasons, opened or used fragrances cannot be returned unless
        faulty. If your item arrives damaged, faulty or incorrect, contact us
        with photos as soon as possible and we&apos;ll put it right. Your statutory
        rights are not affected.
      </p>
      <Link className="inline-flex min-h-11 items-center rounded text-[#7a5d38] underline underline-offset-4 transition-colors hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700 motion-reduce:transition-none" href="/shipping-returns#returns">
        View full Shipping &amp; Returns policy
      </Link>
    </div>
  );
}
