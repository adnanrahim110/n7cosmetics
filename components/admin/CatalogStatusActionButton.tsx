"use client";

import { Archive, Eye, EyeOff, RotateCcw } from "lucide-react";

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

  return (
    <button
      aria-label={`${details.label} ${name}`}
      className={`rounded-md p-2 hover:bg-zinc-100 ${
        destructive
          ? "text-zinc-500 hover:bg-red-50 hover:text-red-600"
          : "text-zinc-500 hover:text-emerald-700"
      }`}
      onClick={(event) => {
        if (destructive && !window.confirm(`${details.label} “${name}”?`)) {
          event.preventDefault();
        }
      }}
      title={details.title}
      type="submit"
    >
      <ActionIcon action={action} />
    </button>
  );
}
