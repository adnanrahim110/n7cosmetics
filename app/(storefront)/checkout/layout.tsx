import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
export const metadata: Metadata = pageMetadata({
  title: "Checkout | N7 Cosmetics",
  description: "Complete your N7 Cosmetics fragrance order with your delivery and payment details.",
  path: "/checkout",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
});
export default function CheckoutLayout({ children }: { children: React.ReactNode }) { return children; }
