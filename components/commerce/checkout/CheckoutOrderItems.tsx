import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { QuoteLine } from "@/lib/commerce/quote";
import { cn } from "@/lib/cn";
import type { CartItem } from "../CommerceProvider";
import CheckoutOrderItem from "./CheckoutOrderItem";
import { checkoutFocus } from "./styles";

interface CheckoutOrderItemsProps {
  items: CartItem[];
  lines?: QuoteLine[];
  disabled: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export default function CheckoutOrderItems({ items, lines, disabled, expanded, onExpandedChange }: CheckoutOrderItemsProps) {
  const listId = useId();

  return (
    <div className="border-b border-[#e8e3d9]">
      <ul aria-label="Order items" id={listId}>
        {items.map((item, index) => (
          <CheckoutOrderItem className={cn(!expanded && index >= 3 && "lg:hidden")} item={item} key={item.slug} line={lines?.find((line) => line.slug === item.slug)} />
        ))}
      </ul>
      {items.length > 3 ? (
        <button aria-controls={listId} aria-expanded={expanded} className={cn("mb-2 hidden min-h-11 w-full items-center justify-center gap-2 rounded text-sm font-medium text-[#805915] hover:bg-[#eee9de] hover:text-black active:bg-[#e3dac9] disabled:cursor-not-allowed disabled:opacity-50 lg:flex", checkoutFocus)} disabled={disabled} onClick={() => onExpandedChange(!expanded)} type="button">
          {expanded ? "Show less" : `Show all (${items.length} items)`}
          <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} />
        </button>
      ) : null}
    </div>
  );
}
