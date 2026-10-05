import { useId, type ComponentProps } from "react";
import type { CheckoutFormField } from "@/lib/commerce/checkout-validation";
import { cn } from "@/lib/cn";
import { checkoutInput } from "./styles";
import CheckoutFieldError from "./CheckoutFieldError";
import { useCheckoutFieldValidation } from "./CheckoutValidationProvider";

interface CheckoutFieldProps extends Omit<ComponentProps<"input">, "name"> {
  label: string;
  name: CheckoutFormField;
  containerClassName?: string;
}

export default function CheckoutField({ label, name, id, className, containerClassName, required, onBlur, onChange, "aria-describedby": describedBy, ...props }: CheckoutFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const validation = useCheckoutFieldValidation(name);
  return (
    <div className={cn("min-w-0 text-sm text-[#181715]", containerClassName)}>
      <label className="font-semibold" htmlFor={fieldId}>{label}{required ? <span className="text-[#9d3e21]"> *</span> : null}</label>
      <input {...props} aria-describedby={[describedBy, validation.error ? errorId : undefined].filter(Boolean).join(" ") || undefined} aria-invalid={Boolean(validation.error)} id={fieldId} name={name} required={required} onBlur={(event) => { validation.onBlur(); onBlur?.(event); }} onChange={(event) => { validation.onChange(); onChange?.(event); }} className={cn(checkoutInput, "mt-1 font-normal", validation.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20", className)} />
      <CheckoutFieldError id={errorId} message={validation.error} />
    </div>
  );
}
