"use client";

import { formatCollectionPrice } from "@/components/collections/collection-config";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import type { SaleStorefrontContent } from "@/lib/commerce/sales";
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function SaleCatalog({ sale }: { sale: SaleStorefrontContent }) {
  const { addItemsToCart, closeCart } = useCommerce();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);
  const [showOfferBar, setShowOfferBar] = useState(false);
  const selectedQuantity = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const complete = selectedQuantity === sale.buyQuantity;
  const detail = sale.pageConfiguration.detail;

  const selectedItems = useMemo(
    () =>
      sale.products.flatMap((product) => {
        const slug = product.slug ?? "";
        const quantity = quantities[slug] ?? 0;
        return slug && quantity ? [{ product, quantity }] : [];
      }),
    [quantities, sale.products],
  );
  const selectedSummary = selectedItems
    .map(
      ({ product, quantity }) =>
        `${product.name}${quantity > 1 ? ` × ${quantity}` : ""}`,
    )
    .join(" · ");

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

  function change(slug: string, delta: number) {
    setAdded(false);
    setQuantities((current) => {
      const currentQuantity = current[slug] ?? 0;
      const currentTotal = Object.values(current).reduce(
        (total, quantity) => total + quantity,
        0,
      );
      if (delta > 0 && currentTotal >= sale.buyQuantity) return current;
      const allowedDelta =
        delta > 0 ? Math.min(delta, sale.buyQuantity - currentTotal) : delta;
      const nextQuantity = Math.max(
        0,
        Math.min(sale.buyQuantity, currentQuantity + allowedDelta),
      );
      if (!nextQuantity) {
        const { [slug]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [slug]: nextQuantity };
    });
  }

  const cartItems = selectedItems.map(({ product, quantity }) => ({
    quantity,
    product: {
      slug: product.slug ?? "",
      href: `/products/${product.slug}`,
      name: product.name,
      image: product.image,
      pricePence: Math.round(product.price * 100),
    },
  }));

  function submitSelection(buyNow = false) {
    if (!complete) return;
    addItemsToCart(cartItems);
    if (buyNow) {
      closeCart();
      router.push("/checkout");
      return;
    }
    setAdded(true);
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

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4">
          {sale.products.map((product) => {
            const slug = product.slug ?? "";
            const quantity = quantities[slug] ?? 0;
            const canAdd = selectedQuantity < sale.buyQuantity;
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
                      disabled={!quantity}
                      onClick={() => change(slug, -1)}
                      type="button"
                    >
                      <Minus size={14} />
                    </button>
                    <Button
                      ariaLabel={
                        quantity
                          ? `Remove ${product.name} from offer selection`
                          : `Add ${product.name} to bag`
                      }
                      ariaPressed={Boolean(quantity)}
                      className={`min-h-11 w-full px-1! py-0! text-[8px]! tracking-widest! sm:text-[9px]! sm:tracking-[0.14em]! ${quantity ? "border-[#9d4d3d]! bg-[#9d4d3d]! text-white! hover:bg-[#8d4939]!" : "border-0! bg-[#1c1814]! text-white! hover:bg-[#8d4939]!"}`}
                      disabled={!quantity && !canAdd}
                      onClick={() => change(slug, quantity ? -quantity : 1)}
                      variant={quantity ? "outline" : "primary"}
                    >
                      {quantity ? `${quantity} in bag` : "Add to Bag"}
                    </Button>
                    <button
                      aria-label={`Select one ${product.name}`}
                      className="grid min-h-11 place-items-center border-l border-black/10 transition hover:bg-white/55 disabled:cursor-not-allowed disabled:text-black/20 disabled:hover:bg-transparent"
                      disabled={!canAdd}
                      onClick={() => change(slug, 1)}
                      type="button"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden={!showOfferBar}
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-60 px-3 transition-[transform,opacity] duration-300 sm:px-5 ${showOfferBar ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+2rem)] opacity-0"}`}
      >
        <div className="pointer-events-auto mx-auto grid max-w-7xl gap-3 border border-black/12 bg-[#fbf8f1]/97 px-3 py-3 shadow-[0_22px_70px_rgba(42,29,18,0.24)] backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden shrink-0 -space-x-2 md:flex">
              {selectedItems.slice(0, 5).map(({ product }) => (
                <span
                  className="relative size-10 overflow-hidden rounded-full border-2 border-[#fbf8f1] bg-[#eee4d7]"
                  key={product.slug}
                >
                  <Image
                    alt=""
                    className="object-contain p-0.5"
                    fill
                    sizes="40px"
                    src={product.image}
                  />
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8d6745]">
                  {complete
                    ? "Offer ready"
                    : `Choose ${sale.buyQuantity - selectedQuantity} more`}
                </p>
                <p className="shrink-0 text-[10px] font-semibold text-black/50">
                  {selectedQuantity} / {sale.buyQuantity}
                </p>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full bg-[#c56f55] transition-[width] duration-300"
                  style={{
                    width: `${Math.min(100, (selectedQuantity / sale.buyQuantity) * 100)}%`,
                  }}
                />
              </div>
              {selectedItems.length ? (
                <div
                  aria-label={selectedSummary}
                  className="mt-1.5 flex gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
                >
                  {selectedItems.slice(0, 5).map(({ product, quantity }) => (
                    <span
                      className="max-w-36 shrink-0 truncate border border-black/8 bg-white/55 px-2 py-1 text-[9px] font-medium text-black/58"
                      key={product.slug}
                    >
                      {product.name}
                      {quantity > 1 ? ` × ${quantity}` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-black/48">
                  Select any {sale.buyQuantity} qualifying products.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              className="min-h-11 w-full border-[#1c1814]! px-3! py-0! text-[9px]! tracking-[0.13em]! text-[#1c1814]! hover:bg-[#1c1814]! hover:text-white! sm:min-w-36"
              disabled={!complete}
              onClick={() => submitSelection()}
              variant="outline"
            >
              <span className="inline-flex items-center gap-2">
                {added ? <Check size={14} /> : <ShoppingBag size={14} />}
                {added ? "Added" : "Add to cart"}
              </span>
            </Button>
            <Button
              className="min-h-11 w-full bg-[#1c1814]! px-3! py-0! text-[9px]! tracking-[0.13em]! text-white! hover:bg-[#8d4939]! sm:min-w-32"
              disabled={!complete}
              onClick={() => submitSelection(true)}
            >
              <span className="inline-flex items-center gap-2">
                Buy now
                <ArrowRight size={14} />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
