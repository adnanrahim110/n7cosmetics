"use client";

import { cn } from "@/lib/cn";
import {
  Check,
  Heart,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useRef, useState } from "react";
import CartAction from "./CartAction";
import type { CommerceProduct } from "./CommerceProvider";
import { useCommerce } from "./CommerceProvider";
import StickyProductPurchase from "./StickyProductPurchase";
import ProductExpressPayment from "./ProductExpressPayment";

export default function ProductDetailActions({
  product,
  paymentEnabled = false,
}: {
  product: CommerceProduct;
  paymentEnabled?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [walletBusy, setWalletBusy] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const {
    isWishlisted,
    toggleWishlist,
    getStock,
    getCartLimit,
    cartBusy,
    hydrated,
  } = useCommerce();
  const soldOut = getStock(product.slug).soldOut;
  const maximum = getCartLimit(product.slug);
  const selectedQuantity = walletBusy ? quantity : Math.min(quantity, Math.max(1, maximum));
  const wishlisted = isWishlisted(product.slug);
  const quantityDisabled = soldOut || maximum === 0 || cartBusy || !hydrated || walletBusy;
  const total = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((product.pricePence * selectedQuantity) / 100);
  const actionClass =
    "order-3 col-span-2 flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-sm px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-[#78552f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:order-none sm:col-span-1";
  return (
    <>
      <div className="mt-5" ref={actionsRef}>
        <div className="grid grid-cols-[minmax(0,1fr)_3rem] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_3rem]">
          <div
            aria-label="Product quantity"
            className="flex min-h-12 w-fit items-center overflow-hidden rounded-sm border border-stone-900/20"
          >
            <button
              aria-label="Decrease quantity"
              className="grid min-h-11 w-11 place-items-center text-stone-900 transition-colors hover:bg-stone-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-700 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              disabled={quantityDisabled || selectedQuantity <= 1}
              onClick={() => setQuantity(selectedQuantity - 1)}
              type="button"
            >
              <Minus aria-hidden="true" size={16} />
            </button>
            <input
              aria-label="Quantity"
              className="min-h-11 w-10 appearance-none bg-transparent text-center text-sm text-stone-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-700 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              disabled={quantityDisabled}
              max={maximum}
              min={1}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next))
                  setQuantity(Math.max(1, Math.min(maximum, Math.floor(next))));
              }}
              type="number"
              value={selectedQuantity}
            />
            <button
              aria-label="Increase quantity"
              className="grid min-h-11 w-11 place-items-center text-stone-900 transition-colors hover:bg-stone-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-700 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              disabled={quantityDisabled || selectedQuantity >= maximum}
              onClick={() => setQuantity(selectedQuantity + 1)}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
            </button>
          </div>
          <CartAction
            className={cn(
              actionClass,
              "bg-[#78552f] text-white hover:bg-[#644422] active:bg-[#523719]",
            )}
            inCartClassName={cn(
              actionClass,
              "border border-[#78552f]/40 bg-[#eee5d8] text-[#644422] hover:bg-[#e6d8c6]",
            )}
            disabled={soldOut || walletBusy}
            product={product}
            quantity={selectedQuantity}
            inCartChildren={
              <>
                <Check size={16} strokeWidth={1.7} />
                View in cart
              </>
            }
          >
            {cartBusy ? (
              <LoaderCircle
                aria-hidden="true"
                className="shrink-0 animate-spin motion-reduce:animate-none"
                size={16}
              />
            ) : (
              <ShoppingBag aria-hidden="true" className="shrink-0" size={16} />
            )}
            <span>
              {soldOut
                ? "Sold out"
                : cartBusy
                  ? "Adding…"
                  : !hydrated
                    ? "Loading…"
                    : `Add to cart · ${total}`}
            </span>
          </CartAction>
          <button
            aria-label={
              wishlisted
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={wishlisted}
            className={cn(
              "grid size-12 place-items-center rounded-sm border border-stone-900/20 transition-colors hover:border-[#78552f] hover:bg-[#eee5d8] focus-visible:ring-2 focus-visible:ring-[#78552f] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none",
              wishlisted && "bg-[#eee5d8] text-[#78552f]",
            )}
            disabled={!hydrated || walletBusy}
            onClick={() => toggleWishlist(product)}
            type="button"
          >
            <Heart
              aria-hidden="true"
              className={cn(wishlisted && "fill-current")}
              size={20}
            />
          </button>
        </div>
        {paymentEnabled ? (
          <ProductExpressPayment
            slug={product.slug}
            quantity={selectedQuantity}
            disabled={soldOut || maximum === 0 || cartBusy || !hydrated}
            onBusyChange={(busy) => {
              if (busy) setQuantity(selectedQuantity);
              setWalletBusy(busy);
            }}
          />
        ) : null}
      </div>
      <StickyProductPurchase
        product={product}
        quantity={selectedQuantity}
        target={actionsRef}
      />
    </>
  );
}
