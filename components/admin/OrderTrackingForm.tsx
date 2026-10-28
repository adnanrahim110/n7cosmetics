"use client";

import { LoaderCircle } from "lucide-react";
import { startTransition, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { readDispatchDestinationAction, saveOrderUpdateAction } from "@/app/admin/(dashboard)/orders/actions";
import { showAdminToast } from "./AdminToastProvider";
import type { DispatchDestination } from "@/lib/admin/order-address";
import type { OrderUpdateResult } from "@/lib/admin/order-status";

export interface OrderTrackingProps {
  orderId: string;
  postageService: string | null;
  trackingReference: string | null;
  historical: boolean;
}

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:opacity-60";

export default function OrderTrackingForm({ orderId, postageService, trackingReference, historical, onSaved, onPendingChange }: OrderTrackingProps & { onSaved?: () => void; onPendingChange?: (pending: boolean) => void }) {
  const id = useId();
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Extract<OrderUpdateResult, { success: false }> | null>(null);

  const [destination, setDestination] = useState<DispatchDestination | null>(null);
  const [destinationConfirmed, setDestinationConfirmed] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    startTransition(async () => {
      try { const result = await readDispatchDestinationAction(orderId); if (active) setDestination(result); }
      catch { if (active) setDestination({ success: false, message: "Unable to load the delivery destination. Try again." }); }
    });
    return () => { active = false; };
  }, [orderId, reload]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || !destination?.success || !destinationConfirmed) return;
    const data = new FormData(event.currentTarget);
    saving.current = true;
    setPending(true);
    onPendingChange?.(true);
    setError(null);
    try {
      const result = await saveOrderUpdateAction(orderId, { kind: "tracking", addressRevision: destination.revision, addressConfirmed: true, postageService: String(data.get("postageService") ?? ""), trackingReference: String(data.get("trackingReference") ?? "") });
      if (!result.success) { setError(result); return; }
      showAdminToast({ id: `order-tracking-${orderId}`, type: "success", title: result.changed ? "Tracking saved · Order shipped" : "Tracking is already up to date", description: result.changed && !historical ? "The customer's dispatch email has been queued." : undefined });
      onSaved?.();
    } catch {
      setError({ success: false, message: "Tracking could not be saved. Please try again." });
    } finally {
      saving.current = false;
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return <form aria-busy={pending} onSubmit={submit}>
    <fieldset className="space-y-4" disabled={pending}>
      <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-sm font-semibold">Delivery destination</p>
        {destination?.success ? <><address className="mt-2 whitespace-pre-line break-words text-sm not-italic leading-6">{destination.address}</address><label className="mt-3 flex min-h-11 items-center gap-3 text-sm"><input checked={destinationConfirmed} className="size-5 accent-amber-700 focus-visible:outline-2 focus-visible:outline-amber-700" onChange={(event) => setDestinationConfirmed(event.target.checked)} type="checkbox" />I have checked this delivery address</label></> : <p className="mt-2 text-sm" role="status">{destination ? destination.message : "Loading destination…"}</p>}
        <button className="min-h-11 rounded px-1 text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-700" onClick={() => { setDestination(null); setDestinationConfirmed(false); setReload((value) => value + 1); }} type="button">Reload destination</button>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700" htmlFor={`${id}-service`}>Postage service</label>
        <input aria-describedby={error?.fieldErrors?.postageService ? `${id}-service-error` : undefined} aria-invalid={Boolean(error?.fieldErrors?.postageService)} className={inputClass} defaultValue={postageService ?? ""} id={`${id}-service`} maxLength={190} name="postageService" placeholder="e.g. Tracked 48" required />
        {error?.fieldErrors?.postageService ? <p className="mt-1 text-xs text-red-700" id={`${id}-service-error`}>{error.fieldErrors.postageService[0]}</p> : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700" htmlFor={`${id}-tracking`}>Tracking number</label>
        <input aria-describedby={error?.fieldErrors?.trackingReference ? `${id}-tracking-error` : undefined} aria-invalid={Boolean(error?.fieldErrors?.trackingReference)} autoCapitalize="characters" className={inputClass} defaultValue={trackingReference ?? ""} id={`${id}-tracking`} maxLength={190} name="trackingReference" placeholder="e.g. VU628745615GB" required spellCheck={false} />
        {error?.fieldErrors?.trackingReference ? <p className="mt-1 text-xs text-red-700" id={`${id}-tracking-error`}>{error.fieldErrors.trackingReference[0]}</p> : null}
      </div>
    </fieldset>
    <p className="mt-3 text-xs leading-5 text-zinc-500">{historical ? "Saving marks this historical order as shipped. No customer email will be sent." : "Saving marks the order as shipped and emails the customer their Royal Mail tracking details."}</p>
    {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error.message}</p> : null}
    <button className="mt-5 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60" disabled={pending || !destination?.success || !destinationConfirmed} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}{pending ? "Saving tracking…" : "Save tracking & mark shipped"}</button>
  </form>;
}
