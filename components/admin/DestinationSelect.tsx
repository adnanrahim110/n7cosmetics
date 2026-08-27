"use client";

import Image from "next/image";
import { FileText, Globe2, LoaderCircle, Package, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { showAdminToast } from "@/components/admin/AdminToastProvider";
import { useBodyAnchoredDropdown } from "@/components/ui/useBodyAnchoredDropdown";
import { isAllowedDestinationHref, type DestinationValue } from "@/lib/admin/destination";

interface DestinationSelectProps {
  name?: string;
  label?: string;
  defaultValue?: DestinationValue | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onChange?: (destination: DestinationValue | null) => void;
  forbiddenHrefs?: string[];
  forbiddenHrefPrefixes?: string[];
}

const kindLabels = { page: "Page", product: "Product", custom: "Custom URL" } as const;

export default function DestinationSelect({ name, label = "Page", defaultValue = null, placeholder = "Search pages or products…", required = false, className = "", onChange, forbiddenHrefs = [], forbiddenHrefPrefixes = [] }: DestinationSelectProps) {
  const [selected, setSelected] = useState<DestinationValue | null>(defaultValue);
  const [query, setQuery] = useState(defaultValue?.label ?? "");
  const [options, setOptions] = useState<DestinationValue[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const inputId = `${listboxId}-input`;
  const { portalTarget, style } = useBodyAnchoredDropdown(open, controlRef, { minimumWidth: 256, preferredHeight: 340 });

  const customValue = query.trim();
  const isForbidden = (href: string) => forbiddenHrefs.includes(href) || forbiddenHrefPrefixes.some((prefix) => href.startsWith(prefix));
  const availableOptions = options.filter((option) => !isForbidden(option.href));
  const showCustom = !selected && isAllowedDestinationHref(customValue) && !isForbidden(customValue) && !availableOptions.some((option) => option.href === customValue);
  const visibleOptions = showCustom ? [...availableOptions, { label: customValue, href: customValue, kind: "custom" as const, description: "Use this custom destination" }] : availableOptions;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/admin/api/destinations?q=${encodeURIComponent(selected ? "" : query.trim())}`, { cache: "no-store", signal: controller.signal });
        const result = await response.json() as { destinations?: DestinationValue[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load pages and products.");
        setOptions(Array.isArray(result.destinations) ? result.destinations : []);
        setActiveIndex(0);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setOptions([]);
        const message = requestError instanceof Error ? requestError.message : "Could not load pages and products.";
        setError(message);
        showAdminToast({ id: `destinations:${message}`, type: "error", title: "Pages and products couldn’t be loaded", description: "Check your connection and try searching again." });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query, selected]);

  function choose(destination: DestinationValue) {
    setSelected(destination);
    setQuery(destination.label);
    setOpen(false);
    setError("");
    onChange?.(destination);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setOptions([]);
    setOpen(true);
    onChange?.(null);
  }

  const dropdown = open && portalTarget ? createPortal(
    <div className="flex min-w-64 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl" id={listboxId} ref={menuRef} role="listbox" style={style}>
      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {visibleOptions.map((option, index) => (
          <button
            aria-selected={selected?.href === option.href}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left ${index === activeIndex ? "bg-amber-50 text-amber-950" : "text-zinc-700 hover:bg-zinc-50"}`}
            id={`${listboxId}-option-${index}`}
            key={`${option.kind}-${option.href}`}
            onClick={() => choose(option)}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
            type="button"
          >
            <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-zinc-100 text-zinc-500">
              {option.mediaUrl ? <Image alt="" className="object-cover" fill sizes="36px" src={option.mediaUrl} unoptimized /> : option.kind === "product" ? <Package size={15} /> : option.kind === "custom" ? <Globe2 size={15} /> : <FileText size={15} />}
            </span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{option.label}</span><span className="block truncate text-[11px] text-zinc-400">{option.description ?? option.href}</span></span>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-400">{kindLabels[option.kind]}</span>
          </button>
        ))}
        {!loading && !visibleOptions.length && !error ? <p className="px-3 py-7 text-center text-sm text-zinc-400">No matching pages or products.</p> : null}
        {error ? <p className="px-3 py-5 text-center text-xs text-red-600">{error}</p> : null}
      </div>
    </div>,
    portalTarget,
  ) : null;

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label ? <label className="mb-1 block text-[13px] font-medium leading-5 text-zinc-700" htmlFor={inputId}>{label}</label> : null}
      {name && selected ? <input name={name} type="hidden" value={selected.href} /> : null}
      {required && !selected ? <input aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 size-px opacity-0" name={name ? `${name}Required` : undefined} required tabIndex={-1} /> : null}
      <div className={`flex min-h-9 items-center gap-2 rounded-md border bg-white px-2.5 transition focus-within:ring-2 ${open ? "border-amber-700 ring-amber-100" : "border-zinc-300"}`} ref={controlRef}>
        <Search aria-hidden="true" className="shrink-0 text-zinc-400" size={14} />
        <input
          aria-activedescendant={open && visibleOptions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          id={inputId}
          onChange={(event) => { setQuery(event.target.value); if (selected) { setSelected(null); onChange?.(null); } setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((current) => Math.min(current + 1, Math.max(visibleOptions.length - 1, 0))); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
            if (event.key === "Enter" && open && visibleOptions[activeIndex]) { event.preventDefault(); choose(visibleOptions[activeIndex]); }
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
          }}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        {loading ? <LoaderCircle aria-label="Loading destinations" className="shrink-0 animate-spin text-amber-700" size={14} /> : null}
        {selected ? <span className="hidden shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:block">{kindLabels[selected.kind]}</span> : null}
        {query ? <button aria-label="Clear destination" className="grid size-6 shrink-0 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" onClick={clear} type="button"><X size={12} /></button> : null}
      </div>
      {selected ? <p className="mt-1 truncate text-[11px] text-zinc-400">{selected.href}</p> : <p className="mt-1 text-[11px] text-zinc-400">Select a suggestion; the URL is applied automatically.</p>}
      {dropdown}
    </div>
  );
}
