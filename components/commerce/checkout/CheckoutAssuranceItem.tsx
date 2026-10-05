import type { LucideIcon } from "lucide-react";

export default function CheckoutAssuranceItem({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <li className="flex min-w-0 items-start gap-2">
      <Icon aria-hidden="true" className="size-7 shrink-0 text-[#196029]" strokeWidth={1.6} />
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-5 text-[#181715]">{title}</p>
        <p className="text-[11px] leading-4 text-[#625f59]">{description}</p>
      </div>
    </li>
  );
}
