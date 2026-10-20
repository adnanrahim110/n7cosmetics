import type { HTMLInputTypeAttribute } from "react";

interface MerchantTextFieldProps {
  name: string; label: string; hint: string; defaultValue: string; maxLength: number;
  error?: string; type?: HTMLInputTypeAttribute;
}
export default function MerchantTextField({ name, label, hint, defaultValue, maxLength, error, type = "text" }: MerchantTextFieldProps) {
  return <div>
    <label className="block text-sm font-medium text-zinc-800" htmlFor={`merchant-${name}`}>{label}</label>
    <input aria-describedby={`merchant-${name}-hint${error ? ` merchant-${name}-error` : ""}`} aria-invalid={Boolean(error)}
      className="mt-2 min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      defaultValue={defaultValue} id={`merchant-${name}`} maxLength={maxLength} name={name} type={type} />
    <p className="mt-2 text-xs leading-5 text-zinc-600" id={`merchant-${name}-hint`}>{hint}</p>
    {error ? <p className="mt-2 text-sm text-red-700" id={`merchant-${name}-error`}>{error}</p> : null}
  </div>;
}
