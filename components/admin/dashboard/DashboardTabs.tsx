"use client";
import type { DashboardRange } from "@/lib/admin/dashboard-dates";
import {
  visibleDashboardTabs,
  type DashboardTab,
} from "@/lib/admin/dashboard-display";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

export default function DashboardTabs({
  active,
  range,
  canManage,
  canViewMetaAds,
}: {
  active: DashboardTab;
  range: DashboardRange;
  canManage: boolean;
  canViewMetaAds: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = visibleDashboardTabs(canManage, canViewMetaAds);
  function activate(tab: DashboardTab) {
    if (tab === active) return;
    const query = new URLSearchParams({
      tab,
      range: range.preset,
      source: range.source,
    });
    if (range.preset === "custom") {
      query.set("start", range.start);
      query.set("end", range.end);
    }
    startTransition(() => router.push(`/admin?${query}`, { scroll: false }));
  }
  return (
    <div className="sticky -top-5 z-30 -mx-5 bg-zinc-950 px-5 sm:-top-7 sm:-mx-7 sm:px-7">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        aria-busy={pending}
        className="flex overflow-x-auto divide-x divide-white/20 justify-center-safe"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`dashboard-tab-${tab.id}`}
            aria-controls="dashboard-panel"
            aria-selected={tab.id === active}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => activate(tab.id)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index - 1 + tabs.length) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                buttons.current[next]?.focus();
              }
            }}
            className={cn(
              "shrink-0 cursor-pointer px-8 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700",
              active === tab.id
                ? "bg-primary-600 text-white border-primary-600"
                : "text-zinc-200 hover:bg-white/15 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {pending ? (
        <p role="status" className="pb-2 text-xs text-zinc-300">
          Loading section…
        </p>
      ) : null}
    </div>
  );
}
