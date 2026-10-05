import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function ProductAssuranceBox({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-22 min-w-0 items-center gap-2 bg-[#f3eee5] px-2 py-4">
      <Icon
        aria-hidden="true"
        className="shrink-0 text-[#8d6745]"
        size={48}
        strokeWidth={1}
      />
      <div className="min-w-0 text-[10px] leading-4 text-stone-600">
        <p className="mb-px text-[9px] font-semibold uppercase tracking-[0.14em] text-black wrap-anywhere">
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}
