"use client";

import { formatCollectionPrice } from "@/components/collections/collection-config";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import Button from "@/components/ui/Button";
import ProductCodeBar from "@/components/ui/ProductCodeBar";
import Title from "@/components/ui/Title";
import type { SaleProduct, SaleStorefrontContent } from "@/lib/commerce/sales";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { formatCartPrice } from "@/components/commerce/CartPriceSummary";
import { MAX_CART_LINES } from "@/lib/commerce/cart-limits";
import { getSaleProgress } from "@/lib/commerce/sale-pricing";

export default function SaleCatalog({ sale }: { sale: SaleStorefrontContent }) {
  const {
    cart,
    addToCart,
    updateQuantity,
    openCart,
    closeCart,
    hydrated,
    cartPricing,
    pricingLoading,
    pricingError,
    couponCode,
  } = useCommerce();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [showOfferBar, setShowOfferBar] = useState(false);
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const chipsId = useId();
  const quantities = Object.fromEntries(
    cart.map((item) => [item.slug, item.quantity]),
  );
  const detail = sale.pageConfiguration.detail;
  const selectedItems = sale.products.flatMap((product) => {
    const quantity = quantities[product.slug ?? ""] ?? 0;
    return quantity ? [{ product, quantity }] : [];
  });
  const hasMoreChips = selectedItems.length > 5;
  const showAllChips = hasMoreChips && chipsExpanded;
  const visibleItems = showAllChips ? selectedItems : selectedItems.slice(0, 5);
  const selectedQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const progress = getSaleProgress(
    selectedQuantity,
    sale.buyQuantity,
    sale.freeQuantity,
  );
  const applied = cartPricing?.discount?.saleId === sale.saleId;
  const freeQuantity = applied ? cartPricing.freeQuantity : 0;
  const progressMessage = !hydrated
    ? "Loading your bag…"
    : pricingLoading
      ? "Updating your offer…"
      : pricingError
        ? "Check your bag"
        : couponCode
          ? "Coupon applied instead of sale offers"
          : applied
            ? `${freeQuantity} ${freeQuantity === 1 ? "bottle" : "bottles"} free · Save ${formatCartPrice(cartPricing.discountPence)}`
            : cartPricing?.discount
              ? `${cartPricing.discount.name} applied`
              : `Choose ${progress.remainingQuantity} more ${progress.remainingQuantity === 1 ? "bottle" : "bottles"} to complete your offer`;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowOfferBar(entry.isIntersecting),
      { rootMargin: "0px 0px -35% 0px", threshold: 0.01 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function change(product: SaleProduct, delta: number) {
    const slug = product.slug ?? "";
    if (!slug || !hydrated) return;
    if (delta < 0) {
      updateQuantity(slug, Math.max(0, (quantities[slug] ?? 0) + delta));
      return;
    }
    addToCart(
      {
        slug,
        href: `/products/${slug}`,
        name: product.name,
        productCode: product.productCode,
        image: product.image,
        pricePence: Math.round(product.price * 100),
      },
      delta,
      { openCart: false, maxQuantity: product.maxQuantity },
    );
  }

  return (
    <section
      className="relative isolate scroll-mt-20 overflow-hidden bg-[#f3eee5] pb-36 pt-16 text-[#1c1814] sm:pb-40 sm:pt-24 lg:pt-32"
      id="sale-selection"
      ref={sectionRef}
    >
      <span className="pointer-events-none absolute -right-7 top-18 -z-10 font-kindred text-[clamp(9rem,22vw,25rem)] uppercase leading-none text-[#2a2018]/2.5">
        SELECT
      </span>
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <div className="mb-10 grid gap-7 sm:mb-14 sm:gap-8 lg:grid-cols-[1.2fr_0.72fr] lg:items-end">
          <div>
            <span className="mb-5 flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8d6745]">
              <span className="h-px w-10 bg-[#c56f55]" />
              {detail.eyebrow}
            </span>
            <Title
              className="uppercase text-[#1d1814]"
              text={detail.title}
              tone="custom"
            />
          </div>
          <div className="lg:justify-self-end lg:text-right">
            <p className="max-w-xl font-heading text-xl italic text-[#3b2e24]/66 sm:text-xl">
              &ldquo;{detail.description}&rdquo;
            </p>
            <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.26em] text-black/32">
              {detail.credit}
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-black/55">
          Choose {progress.groupQuantity} eligible bottles and pay for{" "}
          {sale.buyQuantity}. The lowest-priced{" "}
          {sale.freeQuantity === 1
            ? "bottle is"
            : `${sale.freeQuantity} bottles are`}{" "}
          free. The offer repeats as you add more.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4">
          {sale.products.map((product) => {
            const slug = product.slug ?? "";
            const inspiredBy = product.inspiredBy?.trim();
            const quantity = quantities[slug] ?? 0;
            const pricedLine = cartPricing?.lines.find(
              (line) => line.slug === slug,
            );
            const maximum = pricedLine?.trackInventory
              ? Math.min(product.maxQuantity, pricedLine.stockOnHand)
              : product.maxQuantity;
            const canAdd =
              hydrated &&
              quantity < maximum &&
              (quantity > 0 || cart.length < MAX_CART_LINES);
            return (
              <article
                className={`group flex min-w-0 flex-col transition-opacity ${!canAdd && !quantity ? "opacity-55" : "opacity-100"}`}
                key={slug}
              >
                <Link
                  className="relative aspect-4/5 overflow-hidden border border-black/8 bg-[linear-gradient(145deg,#f8f3eb_0%,#e9ddce_100%)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#9d4d3d]"
                  href={`/products/${slug}`}
                >
                  <span className="absolute inset-x-[15%] bottom-[8%] h-[10%] rounded-full bg-black/10 blur-xl" />
                  <Image
                    alt={product.name}
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.035]"
                    fill
                    sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw"
                    src={product.image}
                  />
                  {inspiredBy || product.productCode?.trim() ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-stretch gap-1">
                      {inspiredBy ? (
                        <span
                          className="min-w-0 flex-1 content-center border-y border-[#967C55]/40 bg-[#eee3d3] px-1.5 py-0.5 text-[7px] font-semibold uppercase leading-3 tracking-[0.04em] text-[#6b4d2c] sm:text-[8px]"
                          title={`Inspired by ${inspiredBy}`}
                        >
                          <span className="line-clamp-2">Inspired by {inspiredBy}</span>
                        </span>
                      ) : null}
                      <ProductCodeBar
                        code={product.productCode}
                        className="shrink-0"
                        compact={Boolean(inspiredBy)}
                      />
                    </div>
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col pt-3">
                  <Link
                    className="line-clamp-1 font-heading text-base tracking-wide hover:text-[#9d4d3d] sm:text-lg"
                    href={`/products/${slug}`}
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCollectionPrice(product.price)}
                  </p>
                  <div className="mt-3 grid grid-cols-[32px_minmax(0,1fr)_32px] border border-black/12 bg-white/35 sm:grid-cols-[42px_minmax(0,1fr)_42px]">
                    <button
                      aria-label={`Remove one ${product.name}`}
                      className="grid min-h-11 place-items-center border-r border-black/10 transition hover:bg-white/55 disabled:cursor-not-allowed disabled:text-black/20 disabled:hover:bg-transparent"
                      disabled={!hydrated || !quantity}
                      onClick={() => change(product, -1)}
                      type="button"
                    >
                      <Minus size={14} />
                    </button>
                    <Button
                      ariaLabel={
                        quantity
                          ? `Add another ${product.name} to bag`
                          : `Add ${product.name} to bag`
                      }
                      className={`min-h-11 w-full px-1! py-0! text-[8px]! tracking-widest! sm:text-[9px]! sm:tracking-[0.14em]! ${quantity ? "border-[#9d4d3d]! bg-[#9d4d3d]! text-white! hover:bg-[#8d4939]!" : "border-0! bg-[#1c1814]! text-white! hover:bg-[#8d4939]!"}`}
                      disabled={!canAdd}
                      onClick={() => change(product, 1)}
                      variant={quantity ? "outline" : "primary"}
                    >
                      {quantity
                        ? `${quantity} in bag`
                        : maximum === 0
                          ? "Sold out"
                          : "Add to Bag"}
                    </Button>
                    <button
                      aria-label={`Select one ${product.name}`}
                      className="grid min-h-11 place-items-center border-l border-black/10 transition hover:bg-white/55 disabled:cursor-not-allowed disabled:text-black/20 disabled:hover:bg-transparent"
                      disabled={!canAdd}
                      onClick={() => change(product, 1)}
                      type="button"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {pricedLine?.freeQuantity ? (
                    <p className="mt-2 text-xs font-medium text-emerald-800">
                      {pricedLine.freeQuantity} free · Save{" "}
                      {formatCartPrice(pricedLine.discountPence)}
                    </p>
                  ) : null}
                  {quantity >= maximum && maximum > 0 ? (
                    <p className="mt-2 text-xs text-black/50">
                      Maximum available in your bag
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden={!showOfferBar}
        inert={!showOfferBar}
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-60 px-3 transition-[transform,opacity] duration-300 sm:px-5 ${showOfferBar ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+2rem)] opacity-0"}`}
      >
        <div className="pointer-events-auto mx-auto grid max-w-7xl gap-3 border border-black/12 bg-[#fbf8f1]/97 px-3 py-3 shadow-[0_22px_70px_rgba(42,29,18,0.24)] backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {selectedItems.length ? (
              <div
                className={`flex min-w-0 shrink-0 items-center ${showAllChips ? "w-[55%] max-w-md" : "w-max max-w-[55%]"}`}
              >
                <div
                  aria-label="Selected offer products"
                  className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain rounded-sm py-1 [scrollbar-color:#bca992_transparent] scrollbar-thin focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745]"
                  id={chipsId}
                  role="region"
                  tabIndex={showAllChips ? 0 : undefined}
                >
                  <ul className="isolate flex w-max -space-x-3 px-1 py-1 lg:-space-x-2">
                    {visibleItems.map(({ product, quantity }) => {
                      const free =
                        cartPricing?.lines.find(
                          (line) => line.slug === product.slug,
                        )?.freeQuantity ?? 0;
                      const label = `${product.name}, ${quantity} in bag${free ? `, ${free} free` : ""}`;
                      return (
                        <li
                          className="relative shrink-0 hover:z-10 focus-within:z-10"
                          key={product.slug}
                        >
                          <button
                            aria-label={`View ${label}`}
                            className={`relative block size-8 rounded-full border-2 bg-[#eee4d7] transition hover:bg-[#e6d8c6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745] lg:size-11 ${free ? "border-emerald-700/60" : "border-[#fbf8f1]"}`}
                            onClick={openCart}
                            title={label}
                            type="button"
                          >
                            <span className="absolute inset-0 overflow-hidden rounded-full">
                              <Image
                                alt=""
                                className="object-contain p-0.5"
                                fill
                                sizes="44px"
                                src={product.image}
                              />
                            </span>
                            <span
                              className={`absolute -bottom-1 left-0 min-w-4 rounded-full px-1 text-[8px] font-semibold leading-4 text-white ${free ? "bg-emerald-800" : "bg-[#1c1814]"}`}
                            >
                              ×{quantity}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {hasMoreChips ? (
                      <li className="sticky right-0 z-10 shrink-0">
                      <button
                        aria-controls={chipsId}
                        aria-expanded={showAllChips}
                        aria-label={
                          showAllChips
                            ? "Collapse selected products"
                            : `Show all ${selectedItems.length} selected products (${selectedItems.length - 5} more)`
                        }
                        className="grid size-8 place-items-center rounded-full border-2 border-[#fbf8f1] bg-[#867d74] text-white transition hover:bg-[#8d4939] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745] lg:size-11"
                        onClick={() => setChipsExpanded(!showAllChips)}
                        title={
                          showAllChips
                            ? "Show fewer products"
                            : `Show ${selectedItems.length - 5} more products`
                        }
                        type="button"
                      >
                        {showAllChips ? (
                          <Minus aria-hidden="true" size={16} />
                        ) : (
                          <Plus aria-hidden="true" size={16} />
                        )}
                      </button>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p
                  aria-live="polite"
                  className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8d6745]"
                >
                  {progressMessage}
                </p>
                <p className="shrink-0 text-[10px] font-semibold text-black/50">
                  {selectedQuantity} in bag
                </p>
              </div>
              <div
                aria-label="Progress toward the next offer"
                aria-valuemax={progress.groupQuantity}
                aria-valuemin={0}
                aria-valuenow={progress.progressQuantity}
                aria-valuetext={`${selectedQuantity} eligible bottles in bag. ${progress.remainingQuantity} more for the next offer.`}
                className="mt-1 h-1 overflow-hidden rounded-full bg-black/8"
                role="progressbar"
              >
                <div
                  className="h-full bg-[#c56f55] transition-[width] duration-300"
                  style={{
                    width: `${Math.min(100, (progress.progressQuantity / progress.groupQuantity) * 100)}%`,
                  }}
                />
              </div>
              {applied ? (
                <p className="mt-1.5 text-xs text-black/55">
                  Add {progress.remainingQuantity} more to earn{" "}
                  {sale.freeQuantity} more free. Keep shopping.
                </p>
              ) : null}
              {pricingError ? (
                <p className="mt-1.5 text-xs text-red-700">{pricingError}</p>
              ) : null}
              {cart.length >= MAX_CART_LINES ? (
                <p className="mt-1.5 text-xs text-black/55">
                  Your bag holds the maximum of {MAX_CART_LINES} different
                  products.
                </p>
              ) : null}
              {!selectedItems.length ? (
                <p className="mt-1.5 text-xs text-black/48">
                  Select any {progress.groupQuantity} eligible bottles to
                  receive {sale.freeQuantity} free.
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              className="min-h-11 w-full border-[#1c1814]! px-3! py-0! text-[9px]! tracking-[0.13em]! text-[#1c1814]! hover:bg-[#1c1814]! hover:text-white! sm:min-w-36"
              disabled={!hydrated || !cart.length}
              onClick={openCart}
              variant="outline"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingBag size={14} />
                View bag
              </span>
            </Button>
            <Button
              className="min-h-11 w-full bg-[#1c1814]! px-3! py-0! text-[9px]! tracking-[0.13em]! text-white! hover:bg-[#8d4939]! sm:min-w-32"
              disabled={!hydrated || !cart.length}
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
            >
              <span className="inline-flex items-center gap-2">
                Checkout
                <ArrowRight size={14} />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
