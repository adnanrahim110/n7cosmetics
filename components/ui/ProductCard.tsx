"use client";

import { Check, Heart, ShoppingBag } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CartAction from "../commerce/CartAction";
import { useCommerce } from "../commerce/CommerceProvider";
import RatingStars from "../commerce/RatingStars";

export interface ProductCardProduct {
  slug: string;
  href?: string;
  name: string;
  image: string;
  price: string;
  pricePence: number;
  rating: number;
  inspiredBy?: string | null;
  productCode?: string | null;
  audience?: string | null;
}

const genderBadges = {
  MEN: { label: "Men", color: "bg-[#2563EB]" },
  WOMEN: { label: "Women", color: "bg-[#DB2777]" },
  UNISEX: { label: "Unisex", color: "bg-[#7C3AED]" },
} as const;

function ProductCardLabels({
  code,
  inspiredBy,
}: {
  code?: string;
  inspiredBy?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center overflow-hidden border-y border-[#967C55]/25 bg-[#f7f2ea]/95 text-center text-[#7A5D38]">
      {code ? (
        <span className="flex w-full items-center justify-center gap-1.5 px-2 py-1">
          <span className="shrink-0 text-[7px] font-semibold uppercase tracking-widest">
            Product code:
          </span>
          <span
            className="min-w-0 truncate font-mono text-sm font-bold leading-4 tracking-[0.12em]"
            title={code}
          >
            {code}
          </span>
        </span>
      ) : null}
      {inspiredBy ? (
        <span
          className={`line-clamp-2 w-full px-2 py-0.5 text-[7px] font-semibold uppercase leading-3 tracking-[0.08em] ${code ? "border-t border-[#967C55]/15" : ""}`}
        >
          Inspired by {inspiredBy}
        </span>
      ) : null}
    </div>
  );
}

function GenderBadge({
  audience,
  className = "",
  style,
  vertical = false,
}: {
  audience?: string | null;
  className?: string;
  style?: React.CSSProperties;
  vertical?: boolean;
}) {
  const normalizedAudience = audience?.trim().toUpperCase();
  const badge =
    normalizedAudience && normalizedAudience in genderBadges
      ? genderBadges[normalizedAudience as keyof typeof genderBadges]
      : null;

  if (!badge) return null;

  return (
    <span
      aria-label={`${badge.label} fragrance`}
      className={`flex shrink-0 items-center justify-center text-center text-[7px] font-bold uppercase leading-none tracking-[0.04em] text-white ${
        vertical ? "h-14 w-6 px-1 py-2" : "px-3 py-1"
      } ${badge.color} ${className}`}
      style={style}
      title={`${badge.label} fragrance`}
    >
      <span
        className={
          vertical
            ? "[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180"
            : undefined
        }
      >
        {badge.label}
      </span>
    </span>
  );
}

function SoldOutOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <span className="border border-white/30 bg-[#1A1A1A]/80 px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-md sm:px-5 sm:text-xs">
        Sold Out
      </span>
    </div>
  );
}

export default function ProductCard({
  product,
  cartAction,
}: {
  product: ProductCardProduct;
  cartAction?: ReactNode;
}) {
  const { isWishlisted, toggleWishlist, getStock } = useCommerce();
  const soldOut = getStock(product.slug).soldOut;
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-200, 200], [10, -10]);
  const rotateY = useTransform(x, [-200, 200], [-10, 10]);
  const slug = product.slug;
  const href = product.href ?? `/products/${slug}`;
  const commerceProduct = {
    slug,
    href,
    name: product.name,
    productCode: product.productCode,
    image: product.image,
    pricePence: product.pricePence,
  };
  const wishlisted = isWishlisted(slug);
  const inspiredBy = product.inspiredBy?.trim();
  const productCode = product.productCode?.trim();

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <>
      <article className="mx-auto flex w-full max-w-sm flex-col sm:hidden [@media(hover:none)]:flex pointer-coarse:flex">
        <div className="relative aspect-4/5 overflow-hidden border border-black/8 bg-[linear-gradient(145deg,#f7f2ea_0%,#ece2d4_100%)]">
          <Link
            aria-label={`View ${product.name}`}
            className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55]"
            href={href}
          />
          <GenderBadge
            audience={product.audience}
            className="pointer-events-none absolute left-1 top-1 z-20"
          />
          <div className="pointer-events-none absolute inset-x-[14%] bottom-[7%] h-[12%] rounded-full bg-black/10 blur-xl" />
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 80vw, 25vw"
            className={`pointer-events-none object-contain drop-shadow-[0_18px_18px_rgba(48,33,19,0.2)] ${soldOut ? "opacity-55" : ""} ${productCode ? "px-3 pt-3 pb-12" : "p-3"}`}
          />
          {soldOut ? <SoldOutOverlay /> : null}
          {productCode || inspiredBy ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
              <ProductCardLabels code={productCode} inspiredBy={inspiredBy} />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => toggleWishlist(commerceProduct)}
            aria-label={`${wishlisted ? "Remove" : "Add"} ${product.name} ${wishlisted ? "from" : "to"} wishlist`}
            aria-pressed={wishlisted}
            className={`absolute right-1 top-1 z-20 grid size-9 place-items-center rounded-full border shadow-[0_8px_24px_rgba(42,29,18,0.05)] backdrop-blur-md transition-colors active:bg-[#1A1A1A] active:text-white ${
              wishlisted
                ? "border-[#967C55]/35 bg-[#967C55] text-white"
                : "border-black/8 bg-white/88 text-[#1A1A1A]"
            }`}
          >
            <Heart
              aria-hidden="true"
              className={wishlisted ? "fill-current" : ""}
              size={18}
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col pt-3 text-left">
          <Link
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55]"
            href={href}
          >
            <h3 className="line-clamp-1 font-heading text-base tracking-wide text-[#1A1A1A]">
              {product.name}
            </h3>
          </Link>
          <RatingStars className="mt-1.5" rating={product.rating} size={13} />
          <span className="mt-1 text-[15px] font-bold text-[#1A1A1A]">
            {product.price}
          </span>

          {cartAction ? (
            <div className="mt-2">{cartAction}</div>
          ) : (
            <CartAction
              ariaLabel={
                soldOut
                  ? `${product.name} is sold out`
                  : `Add ${product.name} to cart`
              }
              className="mt-2 flex min-h-11 w-full items-center justify-center bg-[#967C55] px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white transition-colors enabled:active:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={soldOut}
              inCartClassName="mt-3 flex min-h-11 w-full items-center justify-center border border-[#967C55]/55 bg-[#f5efe5] px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f5738] transition-colors active:border-[#1A1A1A] active:bg-[#1A1A1A] active:text-white"
              product={commerceProduct}
              inCartChildren={
                <span className="flex items-center justify-center gap-1.5">
                  <Check aria-hidden="true" size={13} strokeWidth={1.7} />
                  View in cart
                </span>
              }
            >
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingBag aria-hidden="true" size={14} strokeWidth={2} />
                {soldOut ? "Sold Out" : "Add to Cart"}
              </span>
            </CartAction>
          )}
        </div>
      </article>

      <div
        className={`${soldOut ? "" : "group"} relative mx-auto hidden w-full max-w-sm cursor-pointer flex-col sm:flex sm:max-w-none [@media(hover:none)]:hidden pointer-coarse:hidden`}
      >
        <Link
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#967C55]"
          href={href}
        />
        <motion.div
          style={{ perspective: 1200 }}
          onMouseMove={soldOut ? undefined : handleMouseMove}
          onMouseLeave={soldOut ? undefined : handleMouseLeave}
          className="pointer-events-none relative z-30 aspect-3/4 w-full"
        >
          <motion.div
            style={{
              rotateX: soldOut ? 0 : rotateX,
              rotateY: soldOut ? 0 : rotateY,
              transformStyle: "preserve-3d",
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.5,
            }}
            className="w-full h-full relative"
          >
            {!soldOut ? (
              <div className="absolute inset-10 transition-all duration-700 ease-out bg-white/40 blur-2xl rounded-full">
                <div className="absolute inset-[-10%] bg-linear-to-tr from-[#967C55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-[0.65,0,0.35,1]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square bg-[radial-gradient(circle,rgba(150,124,85,0.08)_0%,transparent_60%)] rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1000 ease-[0.65,0,0.35,1]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-[radial-gradient(circle,rgba(150,124,85,0.15)_0%,transparent_70%)] rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700 ease-[0.65,0,0.35,1] delay-75" />
              </div>
            ) : null}

            <div
              className={`absolute inset-x-0 top-0 z-20 flex items-center justify-center pointer-events-none ${productCode ? "bottom-14" : "bottom-0"}`}
              style={{ transform: "translateZ(80px)" }}
            >
              <div
                className={`relative w-[80%] ${soldOut ? "" : "transition-transform duration-700 ease-[0.65,0,0.35,1] group-hover:scale-110 group-hover:-translate-y-4"} ${productCode ? "h-[90%]" : "h-[80%]"}`}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={`object-contain transition-transform duration-700 ${soldOut ? "opacity-55" : ""}`}
                />
              </div>
            </div>

            {productCode || inspiredBy ? (
              <div
                className={`pointer-events-none absolute inset-x-0 z-40 flex justify-center px-4 ${productCode ? "bottom-5" : "bottom-5"}`}
                style={{ transform: "translateZ(100px)" }}
              >
                <div className="w-fit min-w-40 max-w-full">
                  <ProductCardLabels
                    code={productCode}
                    inspiredBy={inspiredBy}
                  />
                </div>
              </div>
            ) : null}
          </motion.div>
          {soldOut ? <SoldOutOverlay /> : null}
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 aspect-3/4">
          <div className="absolute inset-y-0 right-0 w-16 overflow-hidden pointer-events-none">
            <div className="pointer-events-auto absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => toggleWishlist(commerceProduct)}
                aria-pressed={wishlisted}
                className={`flex size-10 translate-x-0 items-center justify-center rounded-full border border-black/5 bg-white/90 text-[#1A1A1A] opacity-100 shadow-lg backdrop-blur-sm ${soldOut ? "" : "signature-card-action transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white"}`}
                style={{
                  transitionDuration: "500ms",
                  transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
                  transitionDelay: "100ms",
                }}
                aria-label="Add to Wishlist"
              >
                <Heart
                  aria-hidden="true"
                  className={wishlisted ? "fill-current" : ""}
                  size={16}
                  strokeWidth={1.5}
                />
              </button>

              <GenderBadge
                audience={product.audience}
                className={`translate-x-0 opacity-100 ${soldOut ? "" : "signature-card-action transition-all duration-300"}`}
                vertical
                style={{
                  transitionDuration: "500ms",
                  transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
                  transitionDelay: "150ms",
                }}
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative z-30 mt-1 flex flex-col items-center text-center">
          <h3 className="font-heading text-xl md:text-xl text-[#1A1A1A] tracking-wide mb-1 transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>
          <RatingStars className="mb-1.5" rating={product.rating} size={14} />
          <span className="text-[#1A1A1A] font-bold text-base mb-3">
            {product.price}
          </span>

          {cartAction ? (
            <div className="pointer-events-auto w-full">{cartAction}</div>
          ) : (
            <CartAction
              ariaLabel={
                soldOut
                  ? `${product.name} is sold out`
                  : `Add ${product.name} to cart`
              }
              className="group/btn pointer-events-auto relative overflow-hidden bg-[#967C55] px-6 py-3 text-xs uppercase tracking-widest text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              inCartClassName={`group/btn pointer-events-auto relative overflow-hidden border border-[#967C55]/60 bg-[#f5efe5] px-6 py-3 text-xs uppercase tracking-widest text-[#6f5738] ${soldOut ? "" : "hover:text-white transition-colors hover:border-[#6f5738]"}`}
              disabled={soldOut}
              product={commerceProduct}
              inCartChildren={
                <>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Check aria-hidden="true" size={14} strokeWidth={1.7} />
                    View in cart
                  </span>
                  {!soldOut ? (
                    <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
                  ) : null}
                </>
              }
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShoppingBag aria-hidden="true" size={14} strokeWidth={2} />
                {soldOut ? "Sold Out" : "Add to Cart"}
              </span>
              {!soldOut ? (
                <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
              ) : null}
            </CartAction>
          )}
        </div>
      </div>
    </>
  );
}
