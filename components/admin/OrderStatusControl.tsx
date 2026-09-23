"use client";

import { Check, ChevronDown, LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { saveOrderUpdateAction } from "@/app/admin/(dashboard)/orders/actions";
import { orderStatuses, orderStatusLabel, type OrderStatus } from "@/lib/admin/order-status";
import { useBodyAnchoredDropdown } from "@/components/ui/useBodyAnchoredDropdown";
import { showAdminToast } from "./AdminToastProvider";
import OrderTrackingForm, { type OrderTrackingProps } from "./OrderTrackingForm";
import StatusBadge from "./StatusBadge";

function TrackingDialog({ orderNumber, close, ...tracking }: OrderTrackingProps & { orderNumber: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog aria-labelledby={id} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/45 sm:p-6" onCancel={(event) => { event.preventDefault(); if (!pending) close(); }} ref={dialog}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><h2 className="text-lg font-semibold" id={id}>Ship with Royal Mail</h2><p className="mt-1 text-xs text-zinc-500">Order {orderNumber}</p></div>
      <button aria-label="Cancel shipping" className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-50" disabled={pending} onClick={close} type="button"><X aria-hidden="true" size={18} /></button>
    </div>
    <OrderTrackingForm {...tracking} onPendingChange={setPending} onSaved={close} />
    <button className="mt-3 w-full cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50" disabled={pending} onClick={close} type="button">Cancel</button>
  </dialog>;
}

export default function OrderStatusControl({ status, orderNumber, canCancelOrRefund, ...tracking }: OrderTrackingProps & { status: OrderStatus; orderNumber: string; canCancelOrRefund: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const saving = useRef(false);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [pending, setPending] = useState(false);
  const { portalTarget, style } = useBodyAnchoredDropdown(open, trigger, { minimumWidth: 200, preferredHeight: 380 });

  useEffect(() => {
    if (!open || !portalTarget) return;
    const selected = menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]:not(:disabled)');
    (selected ?? menu.current?.querySelector<HTMLButtonElement>("button:not(:disabled)"))?.focus();
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, portalTarget]);

  function close() { setOpen(false); trigger.current?.focus(); }
  function closeShipping() { setShipping(false); trigger.current?.focus(); }

  async function select(next: OrderStatus) {
    close();
    if (next === "SHIPPED") { setShipping(true); return; }
    if (saving.current || next === status) return;
    saving.current = true;
    setPending(true);
    try {
      const result = await saveOrderUpdateAction(tracking.orderId, { kind: "status", status: next });
      showAdminToast(result.success ? { id: `order-status-${tracking.orderId}`, type: "success", title: `Order ${orderStatusLabel(next).toLowerCase()}` } : { id: `order-status-${tracking.orderId}`, type: "error", title: "Status could not be changed", description: result.message });
    } catch {
      showAdminToast({ id: `order-status-${tracking.orderId}`, type: "error", title: "Status could not be changed", description: "Please try again." });
    } finally { saving.current = false; setPending(false); }
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "Tab") { event.preventDefault(); close(); }
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }

  return <>
    <button aria-label={`Change status for order ${orderNumber}: ${orderStatusLabel(status)}`} aria-busy={pending} aria-controls={open ? id : undefined} aria-expanded={open} aria-haspopup="menu" className="inline-flex cursor-pointer items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setOpen(true); } }} ref={trigger} type="button">
      <StatusBadge status={status} />{pending ? <LoaderCircle aria-hidden="true" className="animate-spin text-zinc-500" size={13} /> : <ChevronDown aria-hidden="true" className="text-zinc-500" size={13} />}
    </button>
    {open && portalTarget ? createPortal(<div aria-label={`Order ${orderNumber} status`} className="overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl" id={id} onKeyDown={navigate} ref={menu} role="menu" style={style}>
      {orderStatuses.map((value) => <button aria-checked={value === status} className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 outline-none hover:bg-zinc-50 focus:bg-amber-50 disabled:cursor-not-allowed disabled:text-zinc-400" disabled={!canCancelOrRefund && ["CANCELLED", "REFUNDED"].includes(value)} key={value} onClick={() => void select(value)} role="menuitemradio" tabIndex={-1} title={!canCancelOrRefund && ["CANCELLED", "REFUNDED"].includes(value) ? "Owner or manager only" : undefined} type="button">{orderStatusLabel(value)}{value === status ? <Check aria-hidden="true" size={15} /> : null}</button>)}
    </div>, portalTarget) : null}
    {shipping ? <TrackingDialog {...tracking} close={closeShipping} orderNumber={orderNumber} /> : null}
  </>;
}
