"use client";

import { loadStripe } from "@stripe/stripe-js/pure";
import { createSharedPaymentLoader } from "./shared-loader";

const sharedStripe = createSharedPaymentLoader(loadStripe);
export function paymentStripe(key: string | null) {
  return key && typeof window !== "undefined" ? sharedStripe(key) : null;
}
