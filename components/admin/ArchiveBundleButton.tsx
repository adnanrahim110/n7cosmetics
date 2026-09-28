"use client";

import { Archive } from "lucide-react";
import AdminConfirmButton from "./AdminConfirmButton";

export default function ArchiveBundleButton({ name, disabled }: { name: string; disabled: boolean }) {
  return (
    <AdminConfirmButton
      aria-label={`Archive ${name}`}
      className="rounded-md p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
      disabled={disabled}
      confirmationTitle="Archive bundle?"
      confirmationDescription={`Archive “${name}”? It will be removed from the storefront but retained in admin.`}
      confirmLabel="Archive bundle"
      title="Archive bundle"
    >
      <Archive size={16} />
    </AdminConfirmButton>
  );
}
