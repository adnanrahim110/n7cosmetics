"use client";

import { Archive, Eye, EyeOff, RotateCcw } from "lucide-react";
import AdminConfirmButton from "./AdminConfirmButton";

type CatalogStatusAction = "activate" | "archive" | "hide" | "restore";

const actionDetails: Record<CatalogStatusAction, { label: string; title: string }> = {
  activate: { label: "Activate", title: "Activate" },
  archive: { label: "Archive", title: "Archive" },
  hide: { label: "Hide", title: "Hide" },
  restore: { label: "Restore", title: "Restore as draft" },
};

function ActionIcon({ action }: { action: CatalogStatusAction }) {
  if (action === "activate") return <Eye size={16} />;
  if (action === "archive") return <Archive size={16} />;
  if (action === "hide") return <EyeOff size={16} />;
  return <RotateCcw size={16} />;
}

export default function CatalogStatusActionButton({
  action,
  name,
}: {
  action: CatalogStatusAction;
  name: string;
}) {
  const details = actionDetails[action];
  const destructive = action === "archive" || action === "hide";

  if (destructive) {
    return (
      <AdminConfirmButton
        aria-label={`${details.label} ${name}`}
        className="rounded-md p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600"
        confirmationTitle={`${details.label} item?`}
        confirmationDescription={`${details.label} “${name}”? It will be removed from the storefront but retained in admin.`}
        confirmLabel={details.label}
        title={details.title}
      >
        <ActionIcon action={action} />
      </AdminConfirmButton>
    );
  }

  return (
    <button
      aria-label={`${details.label} ${name}`}
      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-emerald-700"
      title={details.title}
      type="submit"
    >
      <ActionIcon action={action} />
    </button>
  );
}
