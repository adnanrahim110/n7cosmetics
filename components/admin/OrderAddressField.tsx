import type { Ref } from "react";

interface Props {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  maxLength: number;
  error?: string;
  required?: boolean;
  type?: "text" | "tel";
  inputRef?: Ref<HTMLInputElement>;
}

export default function OrderAddressField({ id, name, label, defaultValue, maxLength, error, required, type = "text", inputRef }: Props) {
  return <div>
    <label className="block text-sm font-medium" htmlFor={id}>{label}</label>
    <input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="mt-1 min-h-11 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" defaultValue={defaultValue} id={id} maxLength={maxLength} name={name} ref={inputRef} required={required} type={type} />
    {error ? <p className="mt-1 text-xs text-red-700" id={`${id}-error`}>{error}</p> : null}
  </div>;
}
