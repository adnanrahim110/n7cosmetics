import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wishlist | N7 Cosmetics", alternates: { canonical: "/wishlist" }, robots: { index: false, follow: false } };
export default function WishlistLayout({ children }: { children: React.ReactNode }) { return children; }
