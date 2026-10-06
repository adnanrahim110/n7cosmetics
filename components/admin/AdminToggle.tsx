"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface AdminToggleProps {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function AdminToggle({ name, label, description, defaultChecked = false, onChange }: AdminToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="relative flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-white motion-reduce:transition-none">
      <span>
        <span className="block text-sm font-semibold text-zinc-800">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-5 text-zinc-500">{description}</span> : null}
      </span>
      <input checked={checked} className="peer absolute inset-0 size-full cursor-pointer opacity-0" name={name} onChange={(event) => { setChecked(event.target.checked); onChange?.(event.target.checked); }} type="checkbox" />
      <span aria-hidden="true" className={cn("pointer-events-none relative h-6 w-12 shrink-0 rounded-full border shadow-inner transition peer-focus-visible:ring-2 peer-focus-visible:ring-amber-700 peer-focus-visible:ring-offset-2 motion-reduce:transition-none", checked ? "border-amber-700 bg-amber-700" : "border-zinc-300 bg-zinc-200")}>
        <span className={cn("absolute left-1 top-1 block size-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none", checked ? "translate-x-6" : "translate-x-0")} />
      </span>
    </label>
  );
}
