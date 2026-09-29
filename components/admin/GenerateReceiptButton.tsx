"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download, FileText, LoaderCircle, RefreshCw, X } from "lucide-react";

type Preview = { state: "loading" } | { state: "ready"; url: string } | { state: "error"; message: string };

function ReceiptPreview({ orderId, orderNumber, onClose }: { orderId: string; orderNumber: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [preview, setPreview] = useState<Preview>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    async function load() {
      try {
        const response = await fetch(`/admin/orders/${orderId}/receipt`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || "Could not generate the receipt. Please try again.");
        }
        if (!response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("The receipt could not be loaded. Please sign in and try again.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview({ state: "ready", url: objectUrl });
      } catch (error) {
        if (!controller.signal.aborted) setPreview({ state: "error", message: error instanceof Error ? error.message : "Could not generate the receipt. Please try again." });
      }
    }
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [orderId, attempt]);

  function download() {
    if (preview.state !== "ready") return;
    const link = document.createElement("a");
    link.href = preview.url;
    link.download = `N7-receipt-${orderNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto h-[min(90dvh,960px)] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 text-left text-zinc-950 shadow-2xl backdrop:bg-zinc-950/45 backdrop:backdrop-blur-[3px]">
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-6">
        <div><h2 id={titleId} className="text-lg font-semibold">Receipt preview</h2><p className="mt-0.5 text-sm text-zinc-500">Order {orderNumber}</p></div>
        <button type="button" aria-label="Close receipt preview" onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-600"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 bg-[#f7f2e9] p-3 sm:p-5" aria-busy={preview.state === "loading"}>
        {preview.state === "loading" ? <div role="status" className="flex h-full flex-col items-center justify-center gap-3 text-sm text-zinc-600"><LoaderCircle className="animate-spin text-amber-700" size={28} />Preparing your receipt…</div> : null}
        {preview.state === "error" ? <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center"><p role="alert" className="text-sm text-red-700">{preview.message}</p><button type="button" onClick={() => { setPreview({ state: "loading" }); setAttempt(value => value + 1); }} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium"><RefreshCw size={15} />Try again</button></div> : null}
        {preview.state === "ready" ? <object aria-label={`Receipt for order ${orderNumber}`} data={`${preview.url}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" className="h-full w-full rounded bg-white shadow-sm"><div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-600">PDF preview is unavailable in this browser. Use Download below to save your receipt.</div></object> : null}
      </div>
      <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-200 bg-white px-5 py-4 sm:px-6">
        <button ref={cancel} type="button" onClick={onClose} className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">Cancel</button>
        <button type="button" onClick={download} disabled={preview.state !== "ready"} className="inline-flex items-center gap-2 rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} />Download</button>
      </footer>
    </div>
  </dialog>;
}

export default function GenerateReceiptButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"><FileText size={16} />Generate Receipt</button>
    {open ? <ReceiptPreview orderId={orderId} orderNumber={orderNumber} onClose={() => setOpen(false)} /> : null}
  </>;
}
