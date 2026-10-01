import type { Metadata } from "next";
export const metadata: Metadata = { title: "Shopping cart | N7 Cosmetics", alternates: { canonical: "/cart" }, robots: { index: false, follow: false } };
export default function CartLayout({ children }: { children: React.ReactNode }) { return children; }
