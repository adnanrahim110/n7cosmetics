import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CheckoutSectionHeadingProps {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  children?: ReactNode;
}

export default function CheckoutSectionHeading({ id, title, description, icon: Icon, children }: CheckoutSectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Icon aria-hidden="true" className="mt-1 size-6 shrink-0 text-[#684c20]" strokeWidth={1.7} />
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold leading-7 tracking-normal text-[#111110]" id={id}>{title}</h2>
          {description ? <p className="mt-1 text-sm leading-5 text-[#625f59]">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}
