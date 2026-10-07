import { useId } from "react";
import { cn } from "@/lib/cn";
import type { FaqContent } from "@/lib/homepage/types";

interface FaqItemProps {
  item: FaqContent;
  index: number;
  isActive: boolean;
  onToggle: () => void;
}

export default function FaqItem({ item, index, isActive, onToggle }: FaqItemProps) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;

  return (
    <div className="min-w-0 border-b border-[#967C55]/25">
      <h3 className="font-body tracking-normal">
        <button
          aria-controls={panelId}
          aria-expanded={isActive}
          className={cn(
            "grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4 text-left font-body text-base leading-6 font-medium wrap-anywhere transition-colors duration-200 hover:text-[#77613F] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-800 active:bg-primary-100/30 motion-reduce:transition-none sm:gap-6 sm:text-lg sm:font-normal",
            isActive ? "text-[#77613F]" : "text-[#1C1814]",
          )}
          id={triggerId}
          onClick={onToggle}
          type="button"
        >
          <span aria-hidden="true" className="w-6 font-body text-xs font-medium tabular-nums tracking-wider text-[#77613F] sm:w-8">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">{item.question}</span>
          <span aria-hidden="true" className="relative size-8 text-[#77613F]">
            <span className="absolute top-1/2 left-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
            <span className={cn("absolute top-1/2 left-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 ease-in-out motion-reduce:transition-none", isActive && "scale-y-0")} />
          </span>
        </button>
      </h3>
      <div
        aria-hidden={!isActive}
        aria-labelledby={triggerId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none",
          isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        id={panelId}
        inert={!isActive}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pr-12 pb-4 pl-10 font-body text-sm font-light leading-7 whitespace-pre-line wrap-anywhere text-dark-600 sm:pr-14 sm:pb-6 sm:pl-14 sm:text-base">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}
