import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export default function ProductInformationAccordion({ title, children, defaultOpen = false }: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-700 [&::-webkit-details-marker]:hidden">{title}<ChevronDown aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" size={15} /></summary>
      {children}
    </details>
  );
}
