"use client";
import { useActionState } from "react";
import { checkTikTokConnection } from "@/app/admin/(dashboard)/tiktok/actions";
import TikTokFeedback from "./TikTokFeedback";
export default function TikTokConnectionCheck({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(checkTikTokConnection, {});
  return <form action={action} className="mt-4 space-y-4"><button type="submit" disabled={disabled || pending} className="min-h-11 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:opacity-50">{pending ? "Checking…" : "Send server test event"}</button><TikTokFeedback state={state} /></form>;
}
