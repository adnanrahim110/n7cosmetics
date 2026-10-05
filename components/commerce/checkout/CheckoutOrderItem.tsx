import Image from "next/image";
import Link from "next/link";
import type { QuoteLine } from "@/lib/commerce/quote";
import { cn } from "@/lib/cn";
import { commerceProductHref, type CartItem } from "../CommerceProvider";
import CartLinePrice from "../CartLinePrice";
import { checkoutFocus } from "./styles";

export default function CheckoutOrderItem({ item, line, className }: { item: CartItem; line?: QuoteLine; className?: string }) {
  const name = line?.name || item.name;
  const variantTitle = line?.variantTitle?.trim().replace(/(\d)\s*ml\b/gi, "$1 ml");
  const productCode = line?.productCode || item.productCode;
  return (
    <li className={cn("border-b border-[#e8e3d9] py-2 last:border-0", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Link className={cn("grid min-h-12 min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded hover:text-[#805915]", checkoutFocus)} href={commerceProductHref(item)}>
          <Image alt="" className="size-12 rounded border border-[#ded9cf] bg-white object-contain p-1" height={48} sizes="48px" src={line?.image || item.image} width={48} />
          <div className="min-w-0 text-sm leading-5">
            <p className="font-semibold wrap-break-word">{name}{variantTitle ? <span className="font-normal text-[#625f59]"> - {variantTitle}</span> : null}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-4 text-[#625f59]">
              {productCode ? <p className="wrap-break-word">Product code: {productCode}</p> : null}
              <p>Qty: {item.quantity}</p>
            </div>
          </div>
        </Link>
        <div>
          <CartLinePrice line={line} fallbackPence={item.pricePence * item.quantity} />
        </div>
      </div>
    </li>
  );
}
