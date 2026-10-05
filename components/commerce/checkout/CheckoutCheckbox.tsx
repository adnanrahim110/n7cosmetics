import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { checkoutFocus } from "./styles";

interface CheckoutCheckboxProps extends Omit<ComponentProps<"input">, "type" | "children"> {
  children: ReactNode;
}

export default function CheckoutCheckbox({ children, className, ...props }: CheckoutCheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm leading-5 text-[#181715] has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <input {...props} className={cn("size-5 shrink-0 rounded accent-blue-600", checkoutFocus, className)} type="checkbox" />
      <span className="min-w-0">{children}</span>
    </label>
  );
}
