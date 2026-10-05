import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import type { CheckoutInput } from "@/lib/commerce/validation";
import ExpressPayment from "../ExpressPayment";
import type { CheckoutPaymentMethod } from "./CheckoutWalletBrand";
import { checkoutPaymentAppearance } from "./styles";

interface CheckoutWalletPaymentProps {
  wallet: Exclude<CheckoutPaymentMethod, "card">;
  quote: CheckoutQuote;
  marketingOptOut: boolean;
  onCheckoutDetails: (input: Omit<CheckoutInput, "idempotencyKey">) => void;
  onBusyChange: (busy: boolean) => void;
}

function WalletElement(props: CheckoutWalletPaymentProps) {
  const elements = useElements();
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { elements?.update({ amount: Math.max(30, props.quote.totalPence) }); }, [elements, props.quote.totalPence]);
  return (
    <>
      <ExpressPayment {...props} checkoutStyle onAvailabilityChange={(availability) => setUnavailable(!availability[props.wallet])} />
      {unavailable ? <p role="status" className="text-sm text-[#625f59]">This wallet is currently unavailable. Choose credit / debit card to continue.</p> : null}
    </>
  );
}

export default function CheckoutWalletPayment(props: CheckoutWalletPaymentProps) {
  const stripe = useStripe();
  return (
    <Elements key={props.wallet} stripe={stripe} options={{ mode: "payment", amount: Math.max(30, props.quote.totalPence), currency: "gbp", paymentMethodTypes: ["card"], appearance: checkoutPaymentAppearance }}>
      <WalletElement {...props} />
    </Elements>
  );
}
