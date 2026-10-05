import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type AccordionProps = Omit<ComponentProps<"details">, "children"> & {
  summary: ReactNode;
  summaryClassName?: string;
  children: ReactNode;
};

export default function Accordion({
  summary,
  summaryClassName,
  children,
  className,
  ...props
}: AccordionProps) {
  return (
    <details
      {...props}
      className={cn(
        "group min-w-0",
        "[&::details-content]:grid [&::details-content]:grid-rows-[0fr] [&::details-content]:opacity-0",
        "[&::details-content]:transition-[grid-template-rows,opacity,content-visibility] [&::details-content]:transition-discrete [&::details-content]:duration-300 [&::details-content]:ease-in-out",
        "[&[open]::details-content]:grid-rows-[1fr] [&[open]::details-content]:opacity-100 motion-reduce:[&::details-content]:transition-none",
        className,
      )}
    >
      <summary
        className={cn(
          "min-h-11 cursor-pointer list-none motion-reduce:transition-none [&::-webkit-details-marker]:hidden",
          summaryClassName,
        )}
      >
        {summary}
      </summary>
      <div className="min-h-0 overflow-hidden focus-within:overflow-visible">
        {children}
      </div>
    </details>
  );
}
