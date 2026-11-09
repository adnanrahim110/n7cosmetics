import { useCommerce } from "../CommerceProvider";

export default function CheckoutBottleNotice() {
  const { cart } = useCommerce();
  if (!cart.some((item) => item.isRecreation === true)) return null;

  return (
    <p className="mb-3 flex items-start gap-3 rounded-lg border border-[#e8e3d9] bg-[#f6f3ed] px-4 py-3 text-sm leading-5 text-[#625f59]">
      <span aria-hidden="true" className="flex h-5 shrink-0 items-center">
        <span className="relative size-2 rounded-full bg-[#a67520]">
          <span className="absolute inset-0 hidden rounded-full bg-[#a67520]/60 motion-safe:block motion-safe:animate-ping motion-safe:[animation-duration:2s] motion-safe:[animation-timing-function:cubic-bezier(0.2,0.7,0.3,1)]" />
        </span>
      </span>
      <span className="min-w-0 wrap-break-word">
        <strong className="font-semibold text-[#35332f]">Please Note:</strong>{" "}
        Bottle colours may vary from the images shown due to Yusuf Bhai’s packaging variations. The fragrance remains the same.
      </span>
    </p>
  );
}
