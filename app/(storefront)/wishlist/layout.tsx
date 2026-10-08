import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
export const metadata: Metadata = pageMetadata({
  title: "Wishlist | N7 Cosmetics",
  description: "Keep your favourite N7 Cosmetics fragrances together in your wishlist.",
  path: "/wishlist",
  robots: { index: false, follow: false },
});
export default function WishlistLayout({ children }: { children: React.ReactNode }) { return children; }
