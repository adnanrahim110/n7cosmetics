"use client";

import { useState } from "react";

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
    <label className="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 transition hover:border-zinc-300 hover:bg-white">
      <span>
        <span className="block text-sm font-semibold text-zinc-800">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-5 text-zinc-500">{description}</span> : null}
      </span>
      <input checked={checked} className="peer sr-only" name={name} onChange={(event) => { setChecked(event.target.checked); onChange?.(event.target.checked); }} type="checkbox" />
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 shadow-inner transition ${checked ? "border-amber-700 bg-amber-700" : "border-zinc-300 bg-zinc-200"}`}>
        <span className={`block size-4.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </label>
  );
}
