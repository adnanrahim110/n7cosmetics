"use client";

import { Check, Download, FileDown, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { customerExportFilename, customerExportLimit, customerExportParams, customerExportSchema, defaultCustomerExport, exportColumns, exportFormats, exportSorts, type CustomerExportOptions } from "@/lib/admin/customer-export-options";

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 disabled:bg-zinc-50 disabled:text-zinc-400";
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-600">{label}{children}</label>;
}
type SelectKey = "source" | "orders" | "dateField" | "sort" | "direction" | "delimiter" | "orientation" | "pageSize";

function ExportDialog({ query, source, close }: { query: string; source: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const download = useRef<AbortController | null>(null);
  const titleId = useId();
  const [options, setOptions] = useState(() => defaultCustomerExport(query, source));
  const [scope, setScope] = useState("current");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [preview, setPreview] = useState<{ key: string; count?: number; error?: string } | null>(null);
  const parsed = customerExportSchema.safeParse(options);
  const validationError = parsed.success ? "" : parsed.error.issues[0]?.message;
  const params = customerExportParams(options).toString();
  const previewKey = `${params}:${retry}`;
  const currentPreview = preview?.key === previewKey ? preview : null;
  const count = currentPreview?.count;
  const countLoading = !validationError && !currentPreview;

  useEffect(() => {
    dialog.current?.showModal();
    return () => { download.current?.abort(); };
  }, []);
  useEffect(() => {
    if (validationError) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/admin/customers/export?${params}&preview=true`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not count matching customers.");
        if (!controller.signal.aborted) setPreview({ key: previewKey, count: data.count });
      } catch (e) {
        if (!controller.signal.aborted) setPreview({ key: previewKey, error: e instanceof Error ? e.message : "Could not count matching customers." });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [params, previewKey, validationError]);

  function update<K extends keyof CustomerExportOptions>(key: K, value: CustomerExportOptions[K]) {
    setOptions(previous => ({ ...previous, [key]: value })); setError("");
  }
  function select(key: SelectKey, label: string, choices: readonly { value: string; label: string }[]) {
    return <Field label={label}><select className={inputClass} value={options[key]} onChange={e => update(key, e.target.value as CustomerExportOptions[typeof key])}>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></Field>;
  }
  function dismiss() { download.current?.abort(); dialog.current?.close(); close(); }
  function reset() { setOptions(defaultCustomerExport(query, source)); setScope("current"); setError(""); setRetry(v => v+1); }
  async function exportFile() {
    if (!parsed.success || busy) return;
    setBusy(true); setError("");
    const controller = new AbortController(); download.current = controller;
    try {
      const response = await fetch(`/admin/customers/export?${params}`, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Export failed."); }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url; anchor.download = customerExportFilename(options); document.body.append(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      dismiss();
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Export failed."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  const message = error || validationError || currentPreview?.error || (count !== undefined && count > customerExportLimit ? `Narrow your filters to ${customerExportLimit.toLocaleString("en-GB")} customers or fewer.` : "");

  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={`${titleId}-description`} onCancel={e => { e.preventDefault(); dismiss(); }} onClick={e => {
    if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dismiss(); }
  }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/45 backdrop:backdrop-blur-[3px]">
    <form onSubmit={e => { e.preventDefault(); void exportFile(); }} className="flex h-[min(880px,calc(100dvh-2rem))] min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl border border-amber-200/60 bg-amber-50 text-amber-800"><FileDown size={21} strokeWidth={1.6} /></span><div><h2 id={titleId} className="font-body text-lg font-semibold tracking-tight text-zinc-900">Export customers</h2><p id={`${titleId}-description`} className="mt-0.5 text-xs text-zinc-500">Choose your format, fields and customer selection.</p></div></div>
        <button type="button" aria-label="Close export" onClick={dismiss} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-600"><X size={18} /></button>
      </header>
      <div role="region" aria-label="Export settings" tabIndex={0} className="admin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-600">
      <fieldset disabled={busy} className="min-w-0 space-y-6 px-5 py-5 sm:px-7">
        <fieldset><legend className="mb-3 text-sm font-semibold">File type</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{exportFormats.map(format => <label key={format.value} className={`relative cursor-pointer rounded-xl border p-3 transition-colors focus-within:outline-2 focus-within:outline-amber-600 ${options.format === format.value ? "border-amber-600/50 bg-amber-50/70" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"}`}><input className="sr-only" type="radio" name="format" value={format.value} checked={options.format === format.value} onChange={() => update("format", format.value)} /><span className="flex items-center justify-between gap-1 text-xs font-semibold">{format.label}{options.format === format.value && <Check aria-hidden="true" size={14} className="text-amber-700" />}</span><span className="mt-1 block text-[11px] leading-4 text-zinc-500">{format.description}</span></label>)}</div></fieldset>

        <section className="border-t border-zinc-100 pt-5" aria-label="Customer selection"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-body text-sm font-semibold tracking-normal text-zinc-900">Customer selection</h3><span className="text-[11px] text-zinc-400">Includes all matching pages</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start with"><select className={inputClass} value={scope} onChange={e => { const current = e.target.value === "current"; setScope(e.target.value); setOptions(v => ({ ...v, q: current ? query : "", source: current && (source === "LIVE" || source === "LEGACY") ? source : "ALL" })); }}><option value="current">Current search & origin</option><option value="all">All customers</option></select></Field>
            {select("source", "Origin", [{ value: "ALL", label: "All origins" }, { value: "LIVE", label: "New website" }, { value: "LEGACY", label: "Historical" }])}
            <Field label="Search name, email or phone"><input className={inputClass} maxLength={100} value={options.q} onChange={e => update("q", e.target.value)} placeholder="Any customer" /></Field>
            {select("orders", "Purchase history", [{ value: "all", label: "All customers" }, { value: "with", label: "With orders" }, { value: "without", label: "Without orders" }])}
          </div>
          <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3"><summary className="cursor-pointer text-xs font-medium text-zinc-700">Date range, order count & spending</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {select("dateField", "Date range applies to", [{ value: "created_at", label: "Date added" }, { value: "last_order_at", label: "Last order" }, { value: "registered_at", label: "Registration date" }])}
              <Field label="From (inclusive, UTC)"><input type="date" className={inputClass} value={options.from} onChange={e => update("from", e.target.value)} /></Field>
              <Field label="To (inclusive, UTC)"><input type="date" className={inputClass} value={options.to} onChange={e => update("to", e.target.value)} /></Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{([["minOrders", "Minimum orders"], ["maxOrders", "Maximum orders"], ["minSpend", "Min. net spend (£)"], ["maxSpend", "Max. net spend (£)"]] as const).map(([key,label]) => <Field key={key} label={label}><input type="number" min={key.includes("Orders") ? 0 : undefined} step={key.includes("Orders") ? 1 : "0.01"} placeholder="No limit" className={inputClass} value={options[key]} onChange={e => update(key, e.target.value)} /></Field>)}</div>
            <p className="mt-3 text-[11px] text-zinc-500">Order counts include all statuses. Net spend is successful GBP payments less refunds.</p>
          </details>
        </section>

        <fieldset className="border-t border-zinc-100 pt-5"><legend className="sr-only">Columns to include</legend><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Columns <span className="ml-1 text-xs font-normal text-zinc-400">{options.columns.length} selected</span></p><div className="flex items-center gap-3 text-xs"><button type="button" className="cursor-pointer font-medium text-amber-800 hover:underline" onClick={() => update("columns", exportColumns.map(c => c.key))}>Select all</button><button type="button" className="cursor-pointer text-zinc-500 hover:underline" onClick={() => update("columns", [])}>Clear</button></div></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">{exportColumns.map(column => <label key={column.key} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-xs text-zinc-700"><input type="checkbox" className="size-4 rounded border-zinc-300 accent-amber-700" checked={options.columns.includes(column.key)} onChange={e => update("columns", e.target.checked ? exportColumns.filter(c => c.key === column.key || options.columns.includes(c.key)).map(c => c.key) : options.columns.filter(key => key !== column.key))} />{column.label}</label>)}</div>
        </fieldset>

        <section aria-label="File settings" className="border-t border-zinc-100 pt-5"><div className="grid gap-3 sm:grid-cols-2">{select("sort", "Sort by", exportSorts)}{select("direction", "Sort direction", [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }])}</div>
          <div className="mt-3"><Field label="Filename"><div className="relative"><input required maxLength={100} className={`${inputClass} pr-16`} value={options.filename} onChange={e => update("filename", e.target.value)} /><span className="absolute inset-y-0 right-3 flex items-center text-xs text-zinc-400">.{options.format}</span></div></Field></div>
          {(options.format === "csv" || options.format === "tsv") && <div className="mt-3 grid items-end gap-3 sm:grid-cols-2">{options.format === "csv" && select("delimiter", "Delimiter", [{ value: "comma", label: "Comma (,)" }, { value: "semicolon", label: "Semicolon (;)" }])}<label className="flex items-center gap-2 py-2 text-xs text-zinc-600"><input type="checkbox" className="accent-amber-700" checked={options.bom} onChange={e => update("bom", e.target.checked)} />Excel-compatible UTF-8 encoding</label></div>}
          {(options.format === "pdf" || options.format === "html") && <div className="mt-3 grid grid-cols-2 gap-3">{select("pageSize", "Paper size", [{ value: "A4", label: "A4" }, { value: "A3", label: "A3 · more room for columns" }])}{select("orientation", "Orientation", [{ value: "landscape", label: "Landscape" }, { value: "portrait", label: "Portrait" }])}</div>}
          {(options.format === "json" || options.format === "xml") && <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600"><input type="checkbox" className="accent-amber-700" checked={options.pretty} onChange={e => update("pretty", e.target.checked)} />Indent output for readability</label>}
        </section>
      </fieldset>
      </div>
      <footer className="shrink-0 border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 sm:px-7">
        {message && <p role="alert" className="mb-3 text-xs text-rose-700">{message}{currentPreview?.error && <button type="button" className="ml-2 underline" onClick={() => setRetry(v => v+1)}>Retry</button>}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><div aria-live="polite" className="text-xs text-zinc-500">{countLoading ? <span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="motion-safe:animate-spin" />Counting customers…</span> : count === undefined ? "Adjust your export options" : <><span className="font-semibold text-zinc-900">{count.toLocaleString("en-GB")}</span> matching {count === 1 ? "customer" : "customers"}</>}</div>
          <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={reset} className="mr-1 inline-flex cursor-pointer items-center gap-1.5 px-2 py-2 text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-50"><RotateCcw size={13} />Reset</button><button type="button" onClick={dismiss} className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button><button type="submit" disabled={busy || !!validationError || !!currentPreview?.error || countLoading || !count || count > customerExportLimit} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle size={15} className="motion-safe:animate-spin" /> : <Download size={15} />}{busy ? "Exporting…" : "Export"}</button></div>
        </div>
      </footer>
    </form>
  </dialog>;
}

export default function CustomerExport({ query, source }: { query: string; source: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <><button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"><Download aria-hidden="true" size={16} />Export</button>{open && <ExportDialog query={query} source={source} close={() => { setOpen(false); trigger.current?.focus(); }} />}</>;
}
