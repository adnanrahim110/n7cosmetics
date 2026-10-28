"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { saveOrderUpdateAction } from "@/app/admin/(dashboard)/orders/actions";
import { addressLines, orderShippingAddressSchema, type OrderAddressDetails, type OrderShippingAddress } from "@/lib/admin/order-address";
import type { OrderUpdateResult } from "@/lib/admin/order-status";
import OrderAddressField from "./OrderAddressField";
import { showAdminToast } from "./AdminToastProvider";

const fields = [
  ["fullName", "Recipient name", 190], ["company", "Company (optional)", 190],
  ["line1", "House number and street", 190], ["line2", "Flat / apartment (optional)", 190],
  ["city", "Town / city", 120], ["region", "County (optional)", 120],
  ["postalCode", "Postcode", 30], ["phone", "Delivery phone", 50],
] as const;

export default function OrderShippingAddressForm({ orderId, address, revision, blocked, historical }: { orderId: string; address: OrderAddressDetails; revision: number; blocked: string | null; historical: boolean }) {
  const id = useId();
  const lock = useRef(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Extract<OrderUpdateResult, { success: false }> | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  const errorSummary = useRef<HTMLDivElement>(null);
  function showError(value: Extract<OrderUpdateResult, { success: false }>) {
    setError(value);
    requestAnimationFrame(() => errorSummary.current?.focus());
  }

  function close() { setEditing(false); setError(null); requestAnimationFrame(() => editButton.current?.focus()); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const parsed = orderShippingAddressSchema.safeParse(Object.fromEntries([...fields.map(([key]) => [key, String(form.get(key) ?? "")]), ["countryCode", "GB"]]));
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) (fieldErrors[`address.${issue.path.join(".")}`] ??= []).push(issue.message);
      showError({ success: false, message: "Check the delivery address.", fieldErrors });
      return;
    }
    const next: OrderShippingAddress = parsed.data;
    lock.current = true; setPending(true); setError(null);
    try {
      const result = await saveOrderUpdateAction(orderId, { kind: "shipping-address", address: next, revision, reason: String(form.get("reason") ?? "") });
      if (!result.success) { showError(result); return; }
      showAdminToast({ id: `order-address-${orderId}`, type: "success", title: result.changed ? "Delivery address corrected" : "Address is already up to date", description: result.changed && !historical ? "The customer's address update email has been queued." : undefined });
      close();
    } catch { showError({ success: false, message: "The address could not be saved. Please try again." }); }
    finally { lock.current = false; setPending(false); }
  }

  return <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
    <h2 className="text-base font-semibold">Shipping address</h2>
    {editing ? <form autoComplete="off" aria-busy={pending} className="mt-4 space-y-4" noValidate onSubmit={submit}>
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 focus-visible:outline-2 focus-visible:outline-red-700" ref={errorSummary} role="alert" tabIndex={-1}>
        <p>{error.message}</p>
        {error.fieldErrors ? <ul className="mt-2 list-disc pl-4">{Object.entries(error.fieldErrors).map(([key, messages]) => <li key={key}><a className="underline underline-offset-2" href={`#${id}-${key.replace("address.", "")}`}>{messages[0]}</a></li>)}</ul> : null}
      </div> : null}
      <fieldset className="space-y-4" disabled={pending}>
        <legend className="sr-only">Correct shipping address</legend>
        {fields.map(([key, label, maxLength], index) => <OrderAddressField key={key} id={`${id}-${key}`} name={key} label={`${label}${key === "phone" && historical ? " (optional)" : ""}`} defaultValue={address[key]} maxLength={maxLength} inputRef={index === 0 ? firstInput : undefined} type={key === "phone" ? "tel" : "text"} error={error?.fieldErrors?.[`address.${key}`]?.[0]} />)}
        <p className="text-sm">United Kingdom</p>
        <OrderAddressField id={`${id}-reason`} name="reason" label="Reason for correction" maxLength={400} required error={error?.fieldErrors?.reason?.[0]} />
      </fieldset>
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:opacity-50" disabled={pending} type="submit">{pending ? "Saving…" : "Save delivery address"}</button><button className="min-h-11 rounded border border-zinc-300 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-amber-700" disabled={pending} onClick={close} type="button">Cancel</button></div>
    </form> : <>
      <address className="mt-3 whitespace-pre-line break-words text-sm not-italic leading-6 text-zinc-600">{addressLines(address)}</address>
      {blocked ? <p className="mt-4 text-xs leading-5 text-zinc-600">{blocked}</p> : <button className="mt-4 min-h-11 rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" onClick={() => { setEditing(true); requestAnimationFrame(() => firstInput.current?.focus()); }} ref={editButton} type="button">Edit delivery address</button>}
    </>}
  </article>;
}
