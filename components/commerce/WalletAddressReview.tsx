"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { checkoutAddressSchema } from "@/lib/commerce/checkout-validation";
import { deliveryReviewStateSchema, type DeliveryReviewState } from "@/lib/commerce/delivery-review";
import OrderAddressField from "../admin/OrderAddressField";

const errorSchema = z.object({ error: z.string().optional(), fieldErrors: z.record(z.string(), z.array(z.string())).optional() });
const fields = [["fullName", "Recipient name", 190], ["company", "Company (optional)", 190], ["line1", "House number and street", 190], ["line2", "Flat / apartment (optional)", 190], ["city", "Town / city", 120], ["region", "County (optional)", 120], ["postalCode", "Postcode", 30], ["phone", "Phone number", 50]] as const;

export default function WalletAddressReview({ checkoutKey, onConfirmed }: { checkoutKey: string; onConfirmed: () => void }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const [open, setOpen] = useState(true);
  const [review, setReview] = useState<DeliveryReviewState | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open) { dialog?.showModal(); headingRef.current?.focus(); } else dialog?.close();
    return () => dialog?.close();
  }, [open]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/commerce/orders/address-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: checkoutKey }), cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(errorSchema.safeParse(body).data?.error || "Unable to load your delivery address.");
        const data = deliveryReviewStateSchema.parse(body);
        if (controller.signal.aborted) return;
        if (!data.required) { onConfirmed(); return; }
        setReview(data);
      } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load your delivery address."); }
    }
    void load();
    return () => controller.abort();
  }, [checkoutKey, retry, onConfirmed]);

  function fail(message: string, errors: Record<string, string[]> = {}) {
    setError(message); setFieldErrors(errors);
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || !review?.required) return;
    const data = new FormData(event.currentTarget);
    const address = checkoutAddressSchema.safeParse(editing ? { ...Object.fromEntries(fields.map(([key]) => [key, String(data.get(key) ?? "")])), countryCode: "GB" } : review.address);
    if (!address.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of address.error.issues) (errors[`address.${issue.path.join(".")}`] ??= []).push(issue.message);
      fail("Please check the highlighted address details.", errors); return;
    }
    savingRef.current = true; setPending(true); setError(""); setFieldErrors({});
    try {
      const response = await fetch("/api/commerce/orders/address-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: checkoutKey, revision: review.revision, address: address.data }), signal: AbortSignal.timeout(20000) });
      const body: unknown = await response.json();
      if (!response.ok) { const reason = errorSchema.safeParse(body); fail(reason.data?.error || "Unable to save your delivery address. Please try again.", reason.data?.fieldErrors); return; }
      onConfirmed();
    } catch { fail("The address could not be confirmed. Please try again; you will not be charged again."); }
    finally { savingRef.current = false; setPending(false); }
  }

  function reload() { setReview(null); setEditing(false); setError(""); setFieldErrors({}); setRetry((value) => value + 1); requestAnimationFrame(() => headingRef.current?.focus()); }
  function close() { if (!pending) { setOpen(false); requestAnimationFrame(() => reopenRef.current?.focus()); } }

  return <>
    <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6">
      <p>Your payment is received. Please confirm your delivery address before we dispatch your order.</p>
      <button aria-haspopup="dialog" className="mt-3 min-h-11 rounded bg-stone-950 px-4 py-2 font-semibold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900" onClick={() => setOpen(true)} ref={reopenRef} type="button">Review delivery address</button>
    </div>
    <dialog aria-describedby={`${id}-description`} aria-labelledby={`${id}-title`} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 text-left text-stone-950 shadow-xl backdrop:bg-black/50" id={id} onCancel={(event) => { event.preventDefault(); close(); }} ref={dialogRef}>
      <h2 className="text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-800" id={`${id}-title`} ref={headingRef} tabIndex={-1}>Confirm your delivery address</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600" id={`${id}-description`}>Your payment is complete. Check the address supplied by your wallet, especially the house or flat number and postcode. You can edit it below.</p>
      <form aria-busy={pending} className="mt-5 space-y-4" noValidate onSubmit={confirm}>
        {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 focus-visible:outline-2 focus-visible:outline-red-700" ref={summaryRef} role="alert" tabIndex={-1}>
          <p>{error}</p>
          {Object.keys(fieldErrors).length ? <ul className="mt-2 list-disc pl-4">{Object.entries(fieldErrors).map(([key, messages]) => <li key={key}><a className="underline" href={`#${id}-${key.replace("address.", "")}`}>{messages[0]}</a></li>)}</ul> : null}
          <button className="mt-2 min-h-11 rounded px-1 underline focus-visible:outline-2 focus-visible:outline-red-700" disabled={pending} onClick={reload} type="button">Reload saved address</button>
        </div> : null}
        {review?.required ? <fieldset className="space-y-4" disabled={pending}>
          <legend className="sr-only">Delivery address</legend>
          {editing ? fields.map(([key, label, maxLength], index) => <OrderAddressField key={key} id={`${id}-${key}`} name={key} label={label} maxLength={maxLength} defaultValue={review.address[key] ?? ""} error={fieldErrors[`address.${key}`]?.[0]} inputRef={index === 0 ? firstInputRef : undefined} type={key === "phone" ? "tel" : "text"} />) : <address className="whitespace-pre-line break-words rounded border border-stone-200 bg-stone-50 p-4 text-sm not-italic leading-6">{[review.address.fullName, review.address.company, review.address.line1, review.address.line2, review.address.city, review.address.region, review.address.postalCode, "United Kingdom", review.address.phone].filter(Boolean).join("\n")}</address>}
          <button className="min-h-11 rounded px-1 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-stone-800" onClick={() => { setEditing(!editing); setError(""); setFieldErrors({}); if (!editing) requestAnimationFrame(() => firstInputRef.current?.focus()); }} type="button">{editing ? "Cancel edits" : "Edit delivery address"}</button>
        </fieldset> : !error ? <p className="min-h-24 text-sm text-stone-600" role="status">Loading your delivery address…</p> : null}
        <p className="text-xs leading-5 text-stone-600">Your order will wait for address confirmation before dispatch. For help with a change, <Link className="underline underline-offset-2" href="/contact">contact us</Link>.</p>
        <button className="min-h-12 w-full rounded bg-stone-950 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900 disabled:opacity-50" disabled={pending || !review?.required} type="submit">{pending ? "Confirming address…" : editing ? "Save & confirm delivery address" : "Confirm delivery address"}</button>
        <button className="min-h-11 w-full rounded px-4 py-2 text-sm text-stone-600 underline focus-visible:outline-2 focus-visible:outline-stone-900 disabled:opacity-50" disabled={pending} onClick={close} type="button">Do this later</button>
      </form>
    </dialog>
  </>;
}
