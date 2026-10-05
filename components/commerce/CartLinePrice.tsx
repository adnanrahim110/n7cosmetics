import type { QuoteLine } from "@/lib/commerce/quote";
import { cn } from "@/lib/cn";
import { formatCartPrice } from "./CartPriceSummary";

export default function CartLinePrice({ line, fallbackPence, compact = false }: { line?: Pick<QuoteLine, "subtotalPence" | "totalPence" | "discountPence" | "freeQuantity">; fallbackPence: number; compact?: boolean }) {
  return (
    <span className={cn("block text-right", compact && "leading-4 tabular-nums")}>
      {line?.discountPence ? <del className={cn("mr-2 text-xs font-normal text-black/40", compact && "mr-1 text-[10px] text-stone-600")}>{formatCartPrice(line.subtotalPence)}</del> : null}
      <strong className={cn("text-sm font-semibold", compact && "text-xs")}>{formatCartPrice(line?.totalPence ?? fallbackPence)}</strong>
      {line?.freeQuantity ? <span className={cn("mt-1 block text-xs font-medium text-emerald-800", compact && "text-[10px]")}>{line.freeQuantity} free</span> : null}
    </span>
  );
}
