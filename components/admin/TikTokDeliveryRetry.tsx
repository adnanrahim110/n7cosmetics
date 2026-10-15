"use client";
import { useActionState } from "react";
import { retryTikTokDelivery } from "@/app/admin/(dashboard)/tiktok/actions";
import TikTokFeedback from "./TikTokFeedback";
export default function TikTokDeliveryRetry() {
  const [state, action, pending] = useActionState(retryTikTokDelivery, {});
  return <form action={action} className="mt-4 space-y-4"><p className="text-sm leading-6 text-zinc-700">After correcting credentials or configuration, retry failed events that still have valid consent and remain within the 47-hour delivery window.</p><button type="submit" disabled={pending} className="min-h-11 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-amber-700 disabled:opacity-50">{pending ? "Queuing retries…" : "Retry eligible failed events"}</button><TikTokFeedback state={state} /></form>;
}
