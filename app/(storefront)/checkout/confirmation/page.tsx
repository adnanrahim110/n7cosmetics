import PaymentConfirmation from "@/components/commerce/PaymentConfirmation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order confirmation | N7 Cosmetics", alternates: { canonical: "/checkout/confirmation" }, robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  return <PaymentConfirmation checkoutKey={key || ""} />;
}
