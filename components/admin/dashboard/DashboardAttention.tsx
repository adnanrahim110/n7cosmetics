"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, ClipboardList, PackageSearch, Truck } from "lucide-react";

interface AttentionCard {
  kind: "orders" | "low-stock" | "out-of-stock";
  label: string;
  count: number;
  details: ReactNode;
}

const icons = {
  orders: Truck,
  "low-stock": PackageSearch,
  "out-of-stock": ClipboardList,
};

export default function DashboardAttention({
  cards,
}: {
  cards: AttentionCard[];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const panelIds = cards.map((card) => `${id}-${card.kind}-details`).join(" ");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = icons[card.kind];
        const headingId = `${id}-${card.kind}-heading`;
        return (
          <div
            key={card.kind}
            className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelIds}
              aria-label={`${card.count.toLocaleString("en-GB")} ${card.label}. ${expanded ? "Collapse" : "Expand"} all attention details`}
              onClick={() => setExpanded((value) => !value)}
              className="flex h-24 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-amber-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-700 motion-reduce:transition-none"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-800">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-semibold leading-6 tabular-nums">
                  {card.count.toLocaleString("en-GB")}
                </span>
                <span
                  id={headingId}
                  className="mt-0.5 block text-xs leading-4 text-zinc-500"
                >
                  {card.label}
                </span>
              </span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={`shrink-0 text-zinc-400 transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id={`${id}-${card.kind}-details`}
              role="region"
              aria-labelledby={headingId}
              aria-hidden={!expanded}
              inert={!expanded}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  tabIndex={expanded ? 0 : -1}
                  role="group"
                  aria-label={`${card.label} list`}
                  className="h-64 overflow-y-auto overscroll-contain border-t border-zinc-100 px-4 py-3 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-700"
                >
                  {card.details}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
