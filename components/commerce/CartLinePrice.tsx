import type { QuoteLine } from "@/lib/commerce/quote";
import { formatCartPrice } from "./CartPriceSummary";

export default function CartLinePrice({ line, fallbackPence }: { line?: Pick<QuoteLine, "subtotalPence" | "totalPence" | "discountPence" | "freeQuantity">; fallbackPence: number }) {
  return (
    <span className="block text-right">
      {line?.discountPence ? <del className="mr-2 text-xs font-normal text-black/40">{formatCartPrice(line.subtotalPence)}</del> : null}
      <strong className="text-sm font-semibold">{formatCartPrice(line?.totalPence ?? fallbackPence)}</strong>
      {line?.freeQuantity ? <span className="mt-1 block text-xs font-medium text-emerald-800">{line.freeQuantity} free</span> : null}
    </span>
  );
}
