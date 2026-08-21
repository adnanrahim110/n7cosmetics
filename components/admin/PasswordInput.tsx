"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
}

export default function PasswordInput({ label, hint, className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <span className="relative mt-1.5 block">
        <input
          {...props}
          className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 pr-11 text-zinc-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 ${className}`}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-zinc-400 transition hover:text-zinc-800"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
        </button>
      </span>
      {hint ? <span className="mt-1.5 block text-xs font-normal leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}
