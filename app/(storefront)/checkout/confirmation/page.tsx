import PaymentConfirmation from "@/components/commerce/PaymentConfirmation";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Order confirmation | N7 Cosmetics",
  description: "View the confirmation and payment status of your N7 Cosmetics order.",
  path: "/checkout/confirmation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
});

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  return <PaymentConfirmation checkoutKey={key || ""} />;
}
