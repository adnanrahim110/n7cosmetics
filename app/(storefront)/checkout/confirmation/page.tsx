import PaymentConfirmation from "@/components/commerce/PaymentConfirmation";

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  return <PaymentConfirmation checkoutKey={key || ""} />;
}
