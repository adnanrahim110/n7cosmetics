"use client";

import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  label: string;
  options: CustomSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  accentColor?: string;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
}

export default function CustomSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select an option",
  multiple = false,
  searchable = false,
  searchPlaceholder = "Search options",
  emptyMessage = "No options found",
  accentColor = "#967c55",
  icon: Icon,
  className = "",
  compact = false,
}: CustomSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, query]);

  const summary = !selectedOptions.length
    ? placeholder
    : multiple && selectedOptions.length > 1
      ? `${selectedOptions.length} selected`
      : selectedOptions[0].label;

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);

  const close = (returnFocus = false) => {
    setOpen(false);
    setQuery("");
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const toggleValue = (value: string) => {
    if (multiple) {
      onChange(
        selectedValues.includes(value)
          ? selectedValues.filter((selected) => selected !== value)
          : [...selectedValues, value],
      );
      return;
    }

    onChange([value]);
    close(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        Math.max(
          0,
          options.findIndex((option) => selectedValues.includes(option.value)),
        ),
      );
      return;
    }

    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }

    if (!filteredOptions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filteredOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + filteredOptions.length) % filteredOptions.length,
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      toggleValue(filteredOptions[activeIndex].value);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          setOpen((current) => {
            if (current) setQuery("");
            return !current;
          });
          setActiveIndex(
            Math.max(
              0,
              options.findIndex((option) =>
                selectedValues.includes(option.value),
              ),
            ),
          );
        }}
        className={`group/select relative flex w-full items-center overflow-hidden border border-[#8d755c]/18 bg-[#faf6ef]/88 text-left transition-all duration-400 hover:border-[#9d7d5a]/48 hover:bg-[#fffaf4] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e5237] ${compact ? "min-h-14 gap-2.5 px-3.5 py-2" : "min-h-16 gap-3 px-4 py-3"} ${open ? "border-[#9d7d5a]/58 bg-[#fffaf4] shadow-[0_14px_34px_rgba(44,31,20,0.11)]" : ""}`}
      >
        <span
          className={`absolute inset-y-0 left-0 w-0.75 origin-bottom transition-transform duration-400 ${open || selectedValues.length ? "scale-y-100" : "scale-y-0 group-hover/select:scale-y-100"}`}
          style={{ backgroundColor: accentColor }}
        />
        {Icon ? (
          <span
            className={`flex shrink-0 items-center justify-center rounded-full border transition-all duration-400 ${compact ? "size-8" : "size-9"} ${open || selectedValues.length ? "border-transparent text-white" : "border-[#745d48]/24 text-[#5f4b39]/72 group-hover/select:border-[#745d48]/42 group-hover/select:text-[#382a20]"}`}
            style={
              open || selectedValues.length
                ? { backgroundColor: accentColor }
                : undefined
            }
          >
            <Icon className={compact ? "size-3.5" : "size-4"} strokeWidth={1.5} />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className={`${compact ? "mb-0.5" : "mb-1"} block text-[7px] font-semibold uppercase tracking-[0.24em] text-[#765f4b]/68`}>
            {label}
          </span>
          <span
            className={`block truncate font-semibold uppercase ${compact ? "text-[10px] tracking-[0.12em]" : "text-[11px] tracking-[0.14em]"} ${selectedOptions.length ? "text-[#211a15]" : "text-[#3f3126]/76"}`}
          >
            {summary}
          </span>
        </span>
        {multiple && selectedValues.length ? (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {selectedValues.length}
          </span>
        ) : null}
        <ChevronDown
          className={`size-4 shrink-0 text-black/38 transition-transform duration-400 ${open ? "rotate-180 text-black/70" : "group-hover/select:text-black/62"}`}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={label}
            aria-multiselectable={multiple || undefined}
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 z-60 mt-2 min-w-64 overflow-hidden border border-black/12 bg-[#fbf8f2]/98 shadow-[0_24px_70px_rgba(36,25,17,0.19)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-black/9 px-4 py-3">
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-black/44">
                {multiple ? "Choose one or more" : "Choose one"}
              </span>
              {selectedValues.length ? (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {searchable ? (
              <div className="flex items-center gap-3 border-b border-black/9 px-4 py-3">
                <Search className="size-3.5 shrink-0 text-black/38" />
                <input
                  autoFocus
                  aria-label={searchPlaceholder}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-[10px] tracking-[0.08em] text-black outline-none placeholder:text-black/30"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setActiveIndex(0);
                    }}
                    aria-label="Clear option search"
                    className="text-black/35 transition-colors hover:text-black"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="max-h-70 overflow-y-auto p-2">
              {filteredOptions.map((option, index) => {
                const selected = selectedValues.includes(option.value);
                const active = index === activeIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => toggleValue(option.value)}
                    className={`group/option relative flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-250 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black ${selected ? "bg-black/[0.045] text-[#211a15]" : active ? "bg-black/[0.028] text-[#211a15]" : "text-black/60 hover:bg-black/[0.028] hover:text-[#211a15]"}`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center border transition-all duration-300 ${multiple ? "rounded-sm" : "rounded-full"}`}
                      style={
                        selected
                          ? {
                              borderColor: accentColor,
                              backgroundColor: accentColor,
                              color: "white",
                            }
                          : { borderColor: "rgba(0,0,0,0.2)" }
                      }
                    >
                      {selected ? <Check className="size-3" strokeWidth={2} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.13em]">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="mt-1 block truncate text-[9px] tracking-[0.04em] text-black/34">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}

              {!filteredOptions.length ? (
                <p className="px-4 py-8 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-black/32">
                  {emptyMessage}
                </p>
              ) : null}
            </div>

            {multiple ? (
              <div className="flex items-center justify-between border-t border-black/9 px-4 py-3">
                <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-black/36">
                  {selectedValues.length
                    ? `${selectedValues.length} selected`
                    : "All options included"}
                </span>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className="bg-[#211a15] px-4 py-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Apply
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
