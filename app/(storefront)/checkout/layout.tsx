import type { Metadata } from "next";
export const metadata: Metadata = { title: "Checkout | N7 Cosmetics", alternates: { canonical: "/checkout" }, robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function CheckoutLayout({ children }: { children: React.ReactNode }) { return children; }
