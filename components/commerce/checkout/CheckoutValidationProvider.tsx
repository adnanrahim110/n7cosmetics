import { createContext, useContext, type ReactNode } from "react";
import type { CheckoutFieldErrors, CheckoutFormField } from "@/lib/commerce/checkout-validation";

interface CheckoutValidationContext {
  errors: CheckoutFieldErrors;
  onFieldBlur: (field: CheckoutFormField) => void;
  onFieldChange: (field: CheckoutFormField) => void;
}

const ValidationContext = createContext<CheckoutValidationContext>({ errors: {}, onFieldBlur: () => {}, onFieldChange: () => {} });

export function useCheckoutFieldValidation(field: CheckoutFormField) {
  const context = useContext(ValidationContext);
  return { error: context.errors[field], onBlur: () => context.onFieldBlur(field), onChange: () => context.onFieldChange(field) };
}

export default function CheckoutValidationProvider({ children, ...value }: CheckoutValidationContext & { children: ReactNode }) {
  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>;
}
