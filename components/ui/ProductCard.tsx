"use client";

import { cn } from "@/lib/cn";
import type { ProductCardDetails } from "@/lib/commerce/product-card";
import { productImageAlt } from "@/lib/commerce/product-image";
import { Heart } from "lucide-react";
import { useAnimate, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import CartAction from "../commerce/CartAction";
import { useCommerce } from "../commerce/CommerceProvider";
import RatingStars from "../commerce/RatingStars";
import ProductCardActionContent from "./ProductCardActionContent";

export interface ProductCardProduct extends Partial<ProductCardDetails> {
  slug: string;
  href?: string;
  name: string;
  image: string;
  imageAlt?: string;
  price: string;
  pricePence: number;
  rating: number;
  inspiredBy?: string | null;
  productCode?: string | null;
  audience?: string | null;
}

function ProductCardSummary({ product }: { product: ProductCardProduct }) {
  return (
    <div className="my-2 space-y-1.5 text-left card-desktop:text-center">
      <div className="flex flex-wrap items-center justify-start gap-1.5 card-desktop:justify-center">
        <RatingStars rating={product.rating} size={13} />
        {product.reviewCount !== undefined ? (
          <span className="text-[11px] text-black/55">
            ({product.reviewCount}{" "}
            {product.reviewCount === 1 ? "review" : "reviews"})
          </span>
        ) : null}
      </div>
      {product.scentFamilies?.length ? (
        <p className="text-xs leading-5 text-[#7a5d38]">
          {product.scentFamilies.join(" · ")}
        </p>
      ) : null}
      {product.size ? <p className="text-xs text-black/55">{product.size}</p> : null}
    </div>
  );
}

const genderBadges = {
  MEN: { label: "Men", color: "bg-[#2563EB]" },
  WOMEN: { label: "Women", color: "bg-[#DB2777]" },
  UNISEX: { label: "Unisex", color: "bg-[#7C3AED]" },
} as const;

function ProductCardLabels({ code, inspiredBy }: { code?: string; inspiredBy?: string }) {
  return (
    <div className="flex w-full flex-col items-center overflow-hidden border-y border-[#967C55]/25 bg-[#f7f2ea]/95 text-center text-[#7A5D38]">
      {code ? (
        <span className="flex w-full items-center justify-center gap-1.5 px-2 py-1">
          <span className="shrink-0 text-[7px] font-semibold uppercase tracking-widest">
            Product code:
          </span>
          <span className="min-w-0 truncate font-mono text-sm font-bold leading-4 tracking-[0.12em]" title={code}>
            {code}
          </span>
        </span>
      ) : null}
      {inspiredBy ? (
        <span className={cn("line-clamp-2 w-full px-2 py-0.5 text-[7px] font-semibold uppercase leading-3 tracking-[0.08em]", code && "border-t border-[#967C55]/15")}>
          Inspired by {inspiredBy}
        </span>
      ) : null}
    </div>
  );
}

function GenderBadge({ audience, soldOut }: { audience?: string | null; soldOut: boolean }) {
  const normalizedAudience = audience?.trim().toUpperCase();
  const badge = normalizedAudience === "MEN" ? genderBadges.MEN
    : normalizedAudience === "WOMEN" ? genderBadges.WOMEN
    : normalizedAudience === "UNISEX" ? genderBadges.UNISEX : null;

  if (!badge) return null;

  return (
    <span
      aria-label={`${badge.label} fragrance`}
      title={`${badge.label} fragrance`}
      className={cn(
        "absolute left-2 top-2 flex shrink-0 items-center justify-center rounded-xs px-2.5 py-1 text-center text-[7px] font-bold uppercase leading-none tracking-[0.04em] text-white card-desktop:static card-desktop:h-14 card-desktop:w-6 card-desktop:px-1 card-desktop:py-2 motion-reduce:transition-none",
        badge.color,
        !soldOut && "card-desktop:translate-x-3.5 card-desktop:opacity-0 card-desktop:transition-all card-desktop:duration-500 card-desktop:delay-150 card-desktop:ease-[0.65,0,0.35,1] card-desktop:group-hover:translate-x-0 card-desktop:group-hover:opacity-100 card-desktop:group-focus-within:translate-x-0 card-desktop:group-focus-within:opacity-100",
      )}
    >
      <span className="card-desktop:[writing-mode:vertical-rl] card-desktop:[text-orientation:mixed] card-desktop:rotate-180">
        {badge.label}
      </span>
    </span>
  );
}

export default function ProductCard({ product, cartAction }: { product: ProductCardProduct; cartAction?: ReactNode }) {
  const { isWishlisted, toggleWishlist, getStock } = useCommerce();
  const soldOut = getStock(product.slug).soldOut;
  const [imageScope, animateImage] = useAnimate<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotion();
  const slug = product.slug;
  const href = product.href ?? `/products/${slug}`;
  const commerceProduct = { slug, href, name: product.name, productCode: product.productCode, image: product.image, pricePence: product.pricePence };
  const wishlisted = isWishlisted(slug);
  const inspiredBy = product.inspiredBy?.trim();
  const productCode = product.productCode?.trim();

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    if (soldOut || shouldReduceMotion || !imageScope.current ||
      !window.matchMedia("(min-width: 640px) and (hover: hover) and (pointer: fine)").matches) return;
    const rect = imageScope.current.getBoundingClientRect();
    const x = Math.min(200, Math.max(-200, event.clientX - rect.left - rect.width / 2));
    const y = Math.min(200, Math.max(-200, event.clientY - rect.top - rect.height / 2));
    animateImage(imageScope.current, { rotateX: -y / 20, rotateY: x / 20 }, { type: "spring", stiffness: 400, damping: 30, mass: 0.5 });
  }

  function handleMouseLeave() {
    if (imageScope.current) {
      animateImage(imageScope.current, { rotateX: 0, rotateY: 0 }, { duration: shouldReduceMotion ? 0 : 0.2 });
    }
  }

  return (
    <article
      className={cn("relative mx-auto flex w-full max-w-sm flex-col card-desktop:max-w-none card-desktop:cursor-pointer", !soldOut && "group")}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#967C55]"
        href={href}
      />
      <div className="pointer-events-none relative aspect-4/5 overflow-hidden border border-black/8 bg-[linear-gradient(145deg,#f7f2ea_0%,#ece2d4_100%)] card-desktop:aspect-3/4 card-desktop:overflow-visible card-desktop:border-0 card-desktop:bg-none card-desktop:perspective-distant">
        <div className="relative h-full w-full card-desktop:transform-3d max-sm:transform-none! pointer-coarse:transform-none! [@media(hover:none)]:transform-none! motion-reduce:transform-none!" ref={imageScope}>
          <div aria-hidden="true" className="absolute inset-x-[14%] bottom-[7%] h-[12%] rounded-full bg-black/10 blur-xl card-desktop:hidden" />
          {!soldOut ? (
            <div aria-hidden="true" className="absolute inset-10 hidden rounded-full bg-white/40 blur-2xl transition-all duration-700 ease-out card-desktop:block motion-reduce:transition-none">
              <div className="absolute inset-[-10%] bg-linear-to-tr from-[#967C55]/20 to-transparent opacity-0 transition-opacity duration-1000 ease-[0.65,0,0.35,1] group-hover:opacity-100 motion-reduce:transition-none" />
              <div className="absolute left-1/2 top-1/2 aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2 scale-50 rounded-full bg-[radial-gradient(circle,rgba(150,124,85,0.08)_0%,transparent_60%)] opacity-0 transition-all duration-1000 ease-[0.65,0,0.35,1] group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none" />
              <div className="absolute left-1/2 top-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 scale-50 rounded-full bg-[radial-gradient(circle,rgba(150,124,85,0.15)_0%,transparent_70%)] opacity-0 transition-all duration-700 delay-75 ease-[0.65,0,0.35,1] group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none" />
            </div>
          ) : null}
          <div className={cn("absolute inset-0 card-desktop:inset-x-0 card-desktop:top-0 card-desktop:z-20 card-desktop:flex card-desktop:items-center card-desktop:justify-center card-desktop:translate-z-20", productCode ? "card-desktop:bottom-14" : "card-desktop:bottom-0")}>
            <div className={cn(
              "relative h-full w-full card-desktop:w-4/5",
              productCode ? "card-desktop:h-[82%]" : "card-desktop:h-4/5",
              !soldOut && "card-desktop:transition-transform card-desktop:duration-700 card-desktop:ease-[0.65,0,0.35,1] motion-safe:card-desktop:group-hover:scale-110 motion-safe:card-desktop:group-hover:-translate-y-4 motion-reduce:transition-none",
            )}>
              <Image
                src={product.image}
                alt={productImageAlt({ ...product, productType: href.startsWith("/bundles/") ? "BUNDLE" : "STANDARD" }, product.imageAlt)}
                fill
                sizes="(max-width: 639px) calc(50vw - 40px), (max-width: 1023px) calc(50vw - 32px), 280px"
                className={cn("object-contain drop-shadow-[0_18px_18px_rgba(48,33,19,0.2)] card-desktop:p-0 card-desktop:drop-shadow-none", soldOut && "opacity-55", productCode ? "px-3 pt-3 pb-12" : "p-3")}
              />
            </div>
          </div>
          {productCode || inspiredBy ? (
            <div className="absolute inset-x-0 bottom-0 z-40 card-desktop:bottom-5 card-desktop:flex card-desktop:justify-center card-desktop:px-4 card-desktop:translate-z-25">
              <div className="w-full card-desktop:w-fit card-desktop:min-w-40 card-desktop:max-w-full">
                <ProductCardLabels code={productCode} inspiredBy={inspiredBy} />
              </div>
            </div>
          ) : null}
        </div>
        {soldOut ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <span className="border border-white/30 bg-[#1A1A1A]/80 px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-md sm:px-5 sm:text-xs">Sold Out</span>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 aspect-4/5 card-desktop:aspect-3/4">
        <div className="contents card-desktop:absolute card-desktop:inset-y-0 card-desktop:right-0 card-desktop:block card-desktop:w-16 card-desktop:overflow-hidden">
          <div className="contents card-desktop:absolute card-desktop:right-0 card-desktop:top-1/2 card-desktop:flex card-desktop:-translate-y-1/2 card-desktop:flex-col card-desktop:items-center card-desktop:gap-3 card-desktop:lg:right-4">
            <button
              type="button"
              onClick={() => toggleWishlist(commerceProduct)}
              aria-label={`${wishlisted ? "Remove" : "Add"} ${product.name} ${wishlisted ? "from" : "to"} wishlist`}
              aria-pressed={wishlisted}
              className={cn(
                "pointer-events-auto absolute right-0 top-0 grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] card-desktop:relative card-desktop:size-10 motion-reduce:transition-none",
                !soldOut && "card-desktop:translate-x-3.5 card-desktop:opacity-0 card-desktop:transition-all card-desktop:duration-500 card-desktop:delay-100 card-desktop:ease-[0.65,0,0.35,1] card-desktop:group-hover:translate-x-0 card-desktop:group-hover:opacity-100 card-desktop:group-focus-within:translate-x-0 card-desktop:group-focus-within:opacity-100 card-desktop:focus-visible:translate-x-0 card-desktop:focus-visible:opacity-100",
              )}
            >
              <span className={cn(
                "absolute inset-1 grid place-items-center rounded-full border shadow-[0_8px_24px_rgba(42,29,18,0.05)] backdrop-blur-md transition-colors active:bg-[#1A1A1A] active:text-white card-desktop:inset-0 card-desktop:border-black/5 card-desktop:bg-white/90 card-desktop:text-[#1A1A1A] card-desktop:shadow-lg card-desktop:backdrop-blur-sm card-desktop:hover:bg-[#1A1A1A] card-desktop:hover:text-white motion-reduce:transition-none",
                wishlisted ? "border-[#967C55]/35 bg-[#967C55] text-white" : "border-black/8 bg-white/88 text-[#1A1A1A]",
              )}>
                <Heart aria-hidden="true" className={cn("size-4.5 card-desktop:size-4", wishlisted && "fill-current")} strokeWidth={1.5} />
              </span>
            </button>
            <GenderBadge audience={product.audience} soldOut={soldOut} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none relative z-30 flex flex-1 flex-col pt-3 text-left card-desktop:mt-1 card-desktop:flex-initial card-desktop:items-center card-desktop:pt-0 card-desktop:text-center">
        <h3 className="line-clamp-1 font-heading text-base tracking-wide text-[#1A1A1A] card-desktop:mb-1 card-desktop:text-xl">
          {product.name}
        </h3>
        <ProductCardSummary product={product} />
        <span className="mt-1 text-[15px] font-bold text-[#1A1A1A] card-desktop:mb-3 card-desktop:mt-0 card-desktop:text-base">{product.price}</span>
        {cartAction ? (
          <div className="pointer-events-auto mt-2 card-desktop:mt-0 card-desktop:w-full">{cartAction}</div>
        ) : (
          <CartAction
            ariaLabel={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
            className="group/btn pointer-events-auto relative mt-2 flex min-h-11 w-full items-center justify-center overflow-hidden bg-[#967C55] px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white transition-colors enabled:active:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50 card-desktop:mt-0 card-desktop:min-h-0 card-desktop:w-auto card-desktop:px-6 card-desktop:py-3 card-desktop:text-xs card-desktop:font-normal card-desktop:tracking-widest motion-reduce:transition-none"
            inCartClassName={cn("group/btn pointer-events-auto relative mt-3 flex min-h-11 w-full items-center justify-center overflow-hidden border border-[#967C55]/55 bg-[#f5efe5] px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f5738] transition-colors active:border-[#1A1A1A] active:bg-[#1A1A1A] active:text-white card-desktop:mt-0 card-desktop:min-h-0 card-desktop:w-auto card-desktop:border-[#967C55]/60 card-desktop:px-6 card-desktop:py-3 card-desktop:text-xs card-desktop:font-normal card-desktop:tracking-widest motion-reduce:transition-none", !soldOut && "card-desktop:hover:border-[#6f5738] card-desktop:hover:text-white")}
            disabled={soldOut}
            product={commerceProduct}
            inCartChildren={<ProductCardActionContent inCart soldOut={soldOut} />}
          >
            <ProductCardActionContent soldOut={soldOut} />
          </CartAction>
        )}
      </div>
    </article>
  );
}
