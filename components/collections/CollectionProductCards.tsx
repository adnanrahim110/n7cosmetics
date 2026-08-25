"use client";

import { Check, Eye, Heart, ShoppingBag, Star } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CollectionProduct } from "../../content/collections";
import { slugify } from "../../lib/admin/form";
import type { StorefrontPageComingSoonContent } from "../../lib/storefront-pages/config";
import CartAction from "../commerce/CartAction";
import { useCommerce } from "../commerce/CommerceProvider";
import {
  collectionEase,
  formatCollectionPrice,
  type CollectionDesign,
} from "./collection-config";

function useProductDepth(shouldReduceMotion: boolean | null) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [4, -4]),
    { stiffness: 180, damping: 24 },
  );
  const rotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-5, 5]),
    { stiffness: 180, damping: 24 },
  );
  const imageX = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-11, 11]),
    { stiffness: 180, damping: 24 },
  );
  const imageY = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [-9, 9]),
    { stiffness: 180, damping: 24 },
  );

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return { rotateX, rotateY, imageX, imageY, onPointerMove, onPointerLeave };
}

function ProductActions({ product }: { product: CollectionProduct }) {
  const { isWishlisted, toggleWishlist } = useCommerce();
  const slug = slugify(product.name);
  const commerceProduct = {
    slug,
    name: product.name,
    image: product.image,
    pricePence: Math.round(product.price * 100),
  };
  const wishlisted = isWishlisted(slug);

  return (
    <div className="pointer-events-auto absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 overflow-hidden py-2 sm:right-4">
      <button
        type="button"
        aria-pressed={wishlisted}
        onClick={() => toggleWishlist(commerceProduct)}
        aria-label={`Add ${product.name} to wishlist`}
        className={`collection-card-action flex size-10 translate-x-0 items-center justify-center rounded-full border border-black/8 bg-white/88 text-[#211b16] opacity-100 backdrop-blur-md transition-all duration-500 ease-[0.22,1,0.36,1] hover:bg-[#1c1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b16] ${wishlisted ? "bg-[#1c1814] text-white" : ""}`}
      >
        <Heart
          className={`size-4 ${wishlisted ? "fill-current" : ""}`}
          strokeWidth={1.4}
        />
      </button>
      <Link
        href={`/products/${slug}`}
        aria-label={`Quick view ${product.name}`}
        className="collection-card-action flex size-10 translate-x-0 items-center justify-center rounded-full border border-black/8 bg-white/88 text-[#211b16] opacity-100 backdrop-blur-md transition-all delay-75 duration-500 ease-[0.22,1,0.36,1] hover:bg-[#1c1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b16]"
      >
        <Eye className="size-4" strokeWidth={1.4} />
      </Link>
    </div>
  );
}

function Rating({ rating }: { rating?: number }) {
  return rating ? (
    <span className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <Star key={index} className="size-4 fill-[#997044] text-[#997044]" />
      ))}
      ({rating.toFixed(2)})
    </span>
  ) : (
    <span>New composition</span>
  );
}

interface ProductPresentationProps {
  product: CollectionProduct;
  index: number;
  design: CollectionDesign;
  shouldReduceMotion: boolean | null;
  isBundle: boolean;
}

interface ComingSoonPresentationProps {
  content: StorefrontPageComingSoonContent;
  design: CollectionDesign;
  shouldReduceMotion: boolean | null;
}

export function CollectionComingSoonCard({
  content,
  design,
  shouldReduceMotion,
}: ComingSoonPresentationProps) {
  return (
    <motion.article
      layout
      aria-labelledby="collection-coming-soon-title"
      className="relative min-h-150 overflow-hidden text-[#f6efe6] shadow-[0_35px_80px_-48px_rgba(18,11,7,0.88)] sm:col-span-2 sm:min-h-152 xl:col-span-2"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 46 }}
      style={{ backgroundColor: design.heroBase }}
      transition={{ duration: shouldReduceMotion ? 0 : 1, ease: collectionEase }}
      viewport={{ once: true, margin: "-70px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <span className="pointer-events-none absolute inset-4 border border-white/[0.07]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-40 size-96 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: design.heroSurface }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-44 right-[8%] size-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: design.accent }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 top-2 font-kindred text-[clamp(8rem,16vw,14rem)] uppercase leading-none text-transparent opacity-20"
        style={{ WebkitTextStroke: `1px ${design.accent}` }}
      >
        Soon
      </span>

      <div className="absolute inset-x-0 bottom-0 top-[46%] sm:bottom-[3%] sm:left-[48%] sm:right-[2%] sm:top-[8%]">
        {content.image ? (
          <>
            <span className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] blur-2xl" />
            <span className="pointer-events-none absolute bottom-[10%] left-1/2 h-7 w-[58%] -translate-x-1/2 rounded-full bg-black/35 blur-2xl" />
            <motion.div
              className="absolute inset-[8%]"
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.12, duration: shouldReduceMotion ? 0 : 1.1, ease: collectionEase }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
              <Image
                alt={content.title}
                className="object-contain drop-shadow-[0_42px_32px_rgba(0,0,0,0.36)]"
                fill
                sizes="(max-width: 640px) 100vw, 55vw"
                src={content.image}
              />
            </motion.div>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid aspect-square w-[62%] place-items-center rounded-full border border-white/10 bg-white/[0.025] font-kindred text-[clamp(4.5rem,10vw,8rem)] uppercase text-white/[0.055]">
              N7
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex min-h-150 flex-col justify-between p-7 sm:min-h-152 sm:w-[54%] sm:p-12 sm:pr-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.045] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/58 backdrop-blur-sm">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: design.accent }} />
            Coming soon
          </span>
          <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/28">Private preview</span>
        </div>

        <div className="mb-[44%] mt-12 sm:mb-0 sm:mt-auto">
          <span
            className="mb-4 block text-[9px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: design.accent }}
          >
            {content.eyebrow}
          </span>
          <h2 className="font-heading text-4xl leading-[0.94] text-[#f6efe6] sm:text-5xl" id="collection-coming-soon-title">
            {content.title}
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/52 sm:text-[15px]">
            {content.description}
          </p>
          <div className="mt-7 flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/32">
            <span className="h-px w-12" style={{ backgroundColor: design.accent }} />
            The next chapter
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function CollectionProductCard({
  product,
  index,
  design,
  shouldReduceMotion,
  isBundle,
}: ProductPresentationProps) {
  const depth = useProductDepth(shouldReduceMotion);
  const slug = slugify(product.name);
  const commerceProduct = {
    slug,
    name: product.name,
    image: product.image,
    pricePence: Math.round(product.price * 100),
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-65px" }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.9,
        delay: shouldReduceMotion ? 0 : (index % 4) * 0.07,
        ease: collectionEase,
      }}
      className={`group relative min-w-0 cursor-pointer ${index % 4 === 1 ? "xl:translate-y-16" : index % 4 === 3 ? "xl:translate-y-8" : ""}`}
    >
      <Link
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d6744]"
        href={`/products/${slug}`}
      />
      <div
        onPointerMove={depth.onPointerMove}
        onPointerLeave={depth.onPointerLeave}
        className={`pointer-events-none relative z-30 aspect-3/4 w-full overflow-hidden ${isBundle ? "sm:aspect-[4/4.3]" : ""}`}
        style={{ perspective: 1100 }}
      >
        <div className="pointer-events-none absolute left-1/2 top-[47%] aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6e563f]/10" />
        <div className="pointer-events-none absolute left-1/2 top-[47%] aspect-square w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/42 blur-2xl" />
        <div className="pointer-events-none absolute bottom-[12%] left-1/2 h-5 w-[54%] -translate-x-1/2 rounded-full bg-[#3b2b20]/13 blur-xl" />

        <motion.div
          style={{
            rotateX: depth.rotateX,
            rotateY: depth.rotateY,
            x: depth.imageX,
            y: depth.imageY,
            transformStyle: "preserve-3d",
          }}
          className={`pointer-events-none absolute z-20 ${isBundle ? "inset-[7%]" : "inset-[9%]"}`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain"
          />
        </motion.div>

        <ProductActions product={product} />
        <div className="pointer-events-none absolute inset-x-0 bottom-px z-30 flex items-center justify-between gap-4 border-t border-black/8 bg-[#eee6da]/88 px-4 py-3 backdrop-blur-xl">
          <span className="truncate text-[8px] font-semibold uppercase tracking-[0.24em] text-black/46">
            {product.category}
          </span>
          <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.2em] text-black/52">
            <Rating rating={product.rating} />
          </span>
        </div>
        <div className="absolute bottom-0 left-0 h-px w-full bg-black/12">
          <span
            className="block h-full w-0 transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:w-full"
            style={{ backgroundColor: design.accent }}
          />
        </div>
      </div>

      <div className="relative pt-2.5 text-center">
        <h2 className="mx-auto max-w-xs font-heading text-[1.45rem] leading-tight text-[#1c1814]">
          {product.name}
        </h2>
        <div className="mt-2.5 flex flex-col items-stretch gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="flex items-baseline gap-2 self-start text-[1.7rem] font-medium leading-none text-[#1c1814]">
            {formatCollectionPrice(product.price)}
            {product.compareAtPrice ? (
              <del className="text-sm font-normal text-black/38">
                {formatCollectionPrice(product.compareAtPrice)}
              </del>
            ) : null}
          </span>
          <CartAction
            product={commerceProduct}
            className="group/bag relative z-30 flex h-11 w-full shrink-0 items-stretch justify-between overflow-hidden border border-[#1c1814] bg-[#1c1814] text-white shadow-[0_9px_22px_rgba(28,24,20,0.13)] transition-shadow duration-500 hover:shadow-[0_13px_28px_rgba(28,24,20,0.2)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black sm:w-auto sm:justify-start"
            inCartClassName="group/bag relative z-30 flex h-11 w-full shrink-0 items-stretch justify-between overflow-hidden border border-[#9a7048]/55 bg-[#f6f0e7] text-[#704e31] transition-colors duration-500 hover:border-[#704e31] hover:bg-[#eee3d5] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#704e31] sm:w-auto sm:justify-start"
            inCartChildren={
              <>
                <span className="flex items-center px-4 text-[9px] font-semibold uppercase tracking-[0.2em]">
                  View in cart
                </span>
                <span
                  className="flex w-10 items-center justify-center text-[#18130f] transition-[width] duration-500 group-hover/bag:w-12"
                  style={{ backgroundColor: design.accent }}
                >
                  <Check className="size-3.5" strokeWidth={1.7} />
                </span>
              </>
            }
          >
            <span className="flex items-center px-4 text-[9px] font-semibold uppercase tracking-[0.2em]">
              Add to bag
            </span>
            <span
              className="flex w-10 items-center justify-center text-[#18130f] transition-[width] duration-500 group-hover/bag:w-12"
              style={{ backgroundColor: design.accent }}
            >
              <ShoppingBag
                className="size-3.5 transition-transform duration-500 group-hover/bag:-translate-y-0.5"
                strokeWidth={1.6}
              />
            </span>
          </CartAction>
        </div>
      </div>
    </motion.article>
  );
}

export function CollectionFeaturedCard({
  product,
  index,
  design,
  shouldReduceMotion,
  isBundle,
}: ProductPresentationProps) {
  const depth = useProductDepth(shouldReduceMotion);
  const slug = slugify(product.name);
  const commerceProduct = {
    slug,
    name: product.name,
    image: product.image,
    pricePence: Math.round(product.price * 100),
  };
  const titleParts = product.name.split(", ");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 1, ease: collectionEase }}
      className="group relative min-h-150 overflow-hidden bg-[#e6dccd] sm:col-span-2 sm:min-h-152 xl:col-span-2"
      onPointerMove={depth.onPointerMove}
      onPointerLeave={depth.onPointerLeave}
    >
      <Link
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d6744]"
        href={`/products/${slug}`}
      />
      <div className="pointer-events-none absolute inset-4 border border-black/5.5" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-5 top-0 font-kindred text-[clamp(7rem,13vw,12rem)] uppercase leading-none text-transparent opacity-[0.17]"
        style={{ WebkitTextStroke: `1px ${design.accent}` }}
      >
        {product.name.split(/[ ,]/)[0]}
      </span>

      <div className="absolute inset-x-0 bottom-0 top-[38%] sm:left-[42%] sm:top-[5%]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/8" />
        <div className="pointer-events-none absolute bottom-[11%] left-1/2 h-7 w-[60%] -translate-x-1/2 rounded-full bg-black/13 blur-2xl" />
        <motion.div
          style={{
            x: depth.imageX,
            y: depth.imageY,
            rotateX: depth.rotateX,
            rotateY: depth.rotateY,
          }}
          className={`absolute ${isBundle ? "inset-[4%]" : "inset-[8%]"}`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 55vw"
            className="object-contain drop-shadow-[0_38px_30px_rgba(59,39,23,0.23)]"
          />
        </motion.div>
      </div>

      <div className="pointer-events-none relative z-40 flex h-full min-h-150 flex-col justify-between p-6 sm:min-h-152 sm:w-[48%] sm:p-12 sm:pr-0">
        <div className="mt-8 sm:mt-auto">
          <span
            className="mb-4 block text-[9px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: design.accent }}
          >
            {product.category}
          </span>
          <h2 className="font-heading text-3xl leading-[0.98] text-[#201914] sm:text-5xl">
            {titleParts.map((part, partIndex) => (
              <span
                key={part}
                className={
                  partIndex ? "block font-light italic text-[#8d6744]" : "block"
                }
              >
                {part}
              </span>
            ))}
          </h2>
          <div className="mt-4 flex flex-col items-start gap-2 border-t border-black/14 pt-3 sm:flex-row sm:items-center sm:gap-5">
            <span className="flex flex-wrap items-baseline gap-2 text-3xl tracking-wider text-[#201914]">
              {formatCollectionPrice(product.price)}
              {product.compareAtPrice ? (
                <del className="text-base tracking-normal text-black/38">
                  {formatCollectionPrice(product.compareAtPrice)}
                </del>
              ) : null}
            </span>
            <Rating rating={product.rating} />
          </div>
          <CartAction
            product={commerceProduct}
            className="group/button pointer-events-auto relative z-40 mt-5 overflow-hidden bg-[#1b1714] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.23em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1714]"
            inCartClassName="group/button pointer-events-auto relative z-40 mt-5 overflow-hidden border border-[#8d6744]/55 bg-white/45 px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.23em] text-[#704e31] transition-colors hover:border-[#704e31] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#704e31]"
            inCartChildren={
              <>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  View in cart
                  <Check className="size-4" strokeWidth={1.7} />
                </span>
                <span
                  className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover/button:translate-y-0"
                  style={{ backgroundColor: design.accent }}
                />
              </>
            }
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Add to bag
              <ShoppingBag className="size-4" strokeWidth={1.4} />
            </span>
            <span
              className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover/button:translate-y-0"
              style={{ backgroundColor: design.accent }}
            />
          </CartAction>
        </div>
      </div>
    </motion.article>
  );
}
