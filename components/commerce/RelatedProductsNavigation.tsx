import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

export default function RelatedProductsNavigation({ atStart, atEnd, onPrevious, onNext, className }: {
  atStart: boolean;
  atEnd: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      {[{ label: "Previous", icon: ArrowLeft, disabled: atStart, onClick: onPrevious }, { label: "Next", icon: ArrowRight, disabled: atEnd, onClick: onNext }].map(({ label, icon: Icon, disabled, onClick }) => (
        <button aria-label={`${label} related products`} className="grid size-11 place-items-center rounded-full border border-black/18 transition hover:border-black hover:bg-[#1c1814] hover:text-white focus-visible:ring-2 focus-visible:ring-[#78552f] disabled:cursor-not-allowed disabled:opacity-25 motion-reduce:transition-none" disabled={disabled} key={label} onClick={onClick} type="button"><Icon aria-hidden="true" size={17} strokeWidth={1.4} /></button>
      ))}
    </div>
  );
}
