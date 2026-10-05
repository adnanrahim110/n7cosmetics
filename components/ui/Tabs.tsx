"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export default function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const selectHash = (hash: string, scroll: boolean) => {
      const index = items.findIndex((item) => hash === `#${item.id}`);
      if (index < 0) return;
      setActiveIndex(index);
      if (scroll) window.requestAnimationFrame(() => {
        buttons.current[index]?.focus({ preventScroll: true });
        document.getElementById(items[index].id)?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    };
    const fromHash = () => selectHash(window.location.hash, true);
    const start = window.setTimeout(fromHash, 0);
    const fromLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      const hash = anchor?.getAttribute("href");
      if (!hash || !items.some((item) => hash === `#${item.id}`)) return;
      event.preventDefault();
      window.history.pushState(null, "", hash);
      selectHash(hash, true);
    };
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", fromLink);
    return () => {
      window.clearTimeout(start);
      window.removeEventListener("hashchange", fromHash);
      document.removeEventListener("click", fromLink);
    };
  }, [items]);

  function selectTab(index: number, focus = false) {
    setActiveIndex(index);
    if (items.some((item) => window.location.hash === `#${item.id}`)) {
      window.history.replaceState(null, "", `#${items[index].id}`);
    }
    if (focus) buttons.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % items.length
      : event.key === "ArrowLeft" ? (index - 1 + items.length) % items.length
        : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    selectTab(next, true);
  }

  return (
    <div className="min-w-0">
      <div aria-label={label} className="flex min-w-0 gap-4 overflow-x-auto border-b border-black/12 sm:gap-8" role="tablist">
        {items.map((item, index) => (
          <button aria-controls={item.id} aria-selected={activeIndex === index} className={cn("min-h-12 shrink-0 border-b-2 px-2 py-4 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#78552f] motion-reduce:transition-none sm:px-4", activeIndex === index ? "border-[#1c1814] text-[#1c1814]" : "border-transparent text-stone-600 hover:border-stone-400 hover:text-stone-950")} id={`${item.id}-tab`} key={item.id} onClick={() => selectTab(index)} onKeyDown={(event) => onKeyDown(event, index)} ref={(element) => { buttons.current[index] = element; }} role="tab" tabIndex={activeIndex === index ? 0 : -1} type="button">{item.label}</button>
        ))}
      </div>
      {items.map((item, index) => (
        <div aria-labelledby={`${item.id}-tab`} className="scroll-mt-24 py-8 focus-visible:ring-2 focus-visible:ring-[#78552f] sm:py-10" hidden={activeIndex !== index} id={item.id} key={item.id} role="tabpanel" tabIndex={0}>{item.content}</div>
      ))}
    </div>
  );
}
