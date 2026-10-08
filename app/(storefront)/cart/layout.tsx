import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
export const metadata: Metadata = pageMetadata({
  title: "Shopping cart | N7 Cosmetics",
  description: "Review the fragrances in your N7 Cosmetics shopping cart before checkout.",
  path: "/cart",
  robots: { index: false, follow: false },
});
export default function CartLayout({ children }: { children: React.ReactNode }) { return children; }
