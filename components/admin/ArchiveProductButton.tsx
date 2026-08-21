"use client";

import { Archive } from "lucide-react";

export default function ArchiveProductButton({ name, disabled }: { name: string; disabled: boolean }) {
  return (
    <button
      aria-label={`Archive ${name}`}
      className="rounded-md p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(`Archive “${name}”? It will be removed from the storefront but retained in admin.`)) {
          event.preventDefault();
        }
      }}
      title="Archive product"
      type="submit"
    >
      <Archive size={16} />
    </button>
  );
}
