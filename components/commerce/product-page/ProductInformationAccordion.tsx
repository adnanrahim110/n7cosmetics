import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import Accordion from "@/components/ui/Accordion";

type ProductInformationAccordionProps = {
  title: string;
  children: ReactNode;
  name?: string;
  defaultOpen?: boolean;
};

export default function ProductInformationAccordion({
  title,
  children,
  name,
  defaultOpen = false,
}: ProductInformationAccordionProps) {
  return (
    <Accordion
      name={name}
      open={defaultOpen}
      summaryClassName="flex items-center justify-between gap-4 py-4 text-stone-900 transition-colors hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-stone-700 active:text-stone-950"
      summary={
        <>
          <h2 className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-inherit">
            {title}
          </h2>
          <ChevronDown
            aria-hidden="true"
            className="shrink-0 transition-transform duration-300 ease-in-out group-open:rotate-180 motion-reduce:transition-none"
            size={16}
          />
        </>
      }
    >
      {children}
    </Accordion>
  );
}
