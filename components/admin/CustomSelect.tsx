"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video";
}

interface CustomSelectProps {
  name: string;
  options: CustomSelectOption[];
  defaultValue?: string | string[];
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  required?: boolean;
  searchable?: boolean;
  emptyMessage?: string;
  className?: string;
  onChange?: (values: string[]) => void;
}

function OptionMedia({ option }: { option: CustomSelectOption }) {
  if (!option.mediaUrl) return null;
  if (option.mediaType === "video") {
    return <video aria-hidden="true" className="size-8 shrink-0 rounded bg-zinc-100 object-cover" muted preload="metadata" src={option.mediaUrl} />;
  }
  return <span aria-hidden="true" className="size-8 shrink-0 rounded bg-cover bg-center bg-zinc-100" style={{ backgroundImage: `url(${JSON.stringify(option.mediaUrl)})` }} />;
}

export default function CustomSelect({
  name,
  options,
  defaultValue,
  label,
  placeholder = "Select an option",
  multiple = false,
  required = false,
  searchable = true,
  emptyMessage = "No options found.",
  className = "",
  onChange,
}: CustomSelectProps) {
  const initial = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selectedOptions = options.filter((option) => selected.includes(option.value));
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(normalized));
  }, [options, query]);

  function toggle(value: string) {
    if (multiple) {
      const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
      setSelected(next);
      onChange?.(next);
      return;
    }
    setSelected([value]);
    onChange?.([value]);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label ? <span className="mb-1 block text-[13px] font-medium leading-5 text-zinc-700">{label}</span> : null}
      {selected.map((value) => <input key={value} name={name} type="hidden" value={value} />)}
      {required && !selected.length ? <input aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 size-px opacity-0" defaultValue="" name={`${name}Required`} required tabIndex={-1} /> : null}
      <button
        aria-expanded={open}
        className="flex min-h-9 w-full items-center gap-2 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-left text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={`min-w-0 flex-1 ${selectedOptions.length ? "text-zinc-950" : "text-zinc-400"}`}>
          {multiple && selectedOptions.length ? `${selectedOptions.length} selected` : selectedOptions[0]?.label ?? placeholder}
        </span>
        <ChevronDown aria-hidden="true" className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`} size={16} />
      </button>
      {multiple && selectedOptions.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedOptions.slice(0, 3).map((option) => (
            <button className="inline-flex max-w-48 items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-200" key={option.value} onClick={() => toggle(option.value)} type="button">
              <span className="truncate">{option.label}</span><X aria-hidden="true" className="shrink-0" size={11} />
            </button>
          ))}
          {selectedOptions.length > 3 ? <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">+{selectedOptions.length - 3} more</span> : null}
        </div>
      ) : null}
      {open ? (
        <div className="absolute z-50 mt-1 w-full min-w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
          {searchable && options.length > 5 ? (
            <label className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
              <Search aria-hidden="true" className="text-zinc-400" size={15} />
              <span className="sr-only">Search options</span>
              <input autoFocus className="min-w-0 flex-1 bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search…" value={query} />
            </label>
          ) : null}
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${active ? "bg-amber-50 text-amber-950" : "text-zinc-700 hover:bg-zinc-50"}`} key={option.value} onClick={() => toggle(option.value)} type="button">
                  <OptionMedia option={option} />
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{option.label}</span>{option.description ? <span className="block truncate text-xs text-zinc-400">{option.description}</span> : null}</span>
                  <span className={`grid size-5 shrink-0 place-items-center rounded ${multiple ? "border" : "rounded-full"} ${active ? "border-amber-700 bg-amber-700 text-white" : "border-zinc-300"}`}>{active ? <Check aria-hidden="true" size={12} /> : null}</span>
                </button>
              );
            })}
            {!filteredOptions.length ? <p className="px-3 py-6 text-center text-sm text-zinc-400">{emptyMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
