import { Check, ShoppingBag } from "lucide-react";

interface ProductCardActionContentProps {
  inCart?: boolean;
  soldOut: boolean;
}

export default function ProductCardActionContent({
  inCart = false,
  soldOut,
}: ProductCardActionContentProps) {
  const Icon = inCart ? Check : ShoppingBag;

  return (
    <>
      <span className="relative z-10 flex items-center justify-center gap-1.5 card-desktop:gap-2">
        <Icon aria-hidden="true" size={14} strokeWidth={inCart ? 1.7 : 2} />
        {inCart ? "View in cart" : soldOut ? "Sold Out" : "Add to Cart"}
      </span>
      {!soldOut ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 hidden translate-y-full bg-[#1A1A1A] transition-transform duration-500 ease-[0.65,0,0.35,1] card-desktop:block card-desktop:group-hover/btn:translate-y-0 motion-reduce:transition-none"
        />
      ) : null}
    </>
  );
}
