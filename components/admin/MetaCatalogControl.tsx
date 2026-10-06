"use client";
import { useActionState } from "react";
import { controlMetaCatalog, type MetaCatalogFormState } from "@/app/admin/(dashboard)/meta/catalog-actions";
import MetaActionFeedback from "./MetaActionFeedback";

export default function MetaCatalogControl({ kind, disabled }: { kind: "check" | "sync"; disabled: boolean }) {
  const [state, action, pending] = useActionState<MetaCatalogFormState, FormData>(controlMetaCatalog, {});
  return <form action={action} className="min-w-0 space-y-3">
    <input type="hidden" name="kind" value={kind} />
    <button type="submit" disabled={disabled || pending} className="min-h-11 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50">{pending ? kind === "check" ? "Checking…" : "Requesting…" : kind === "check" ? "Check catalogue access" : "Sync now / retry failed"}</button>
    <MetaActionFeedback state={state} />
  </form>;
}
