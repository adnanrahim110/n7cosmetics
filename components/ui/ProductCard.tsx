"use client";

import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import CartAction from "../commerce/CartAction";
import { useCommerce } from "../commerce/CommerceProvider";
import RatingStars from "../commerce/RatingStars";

export interface ProductCardProduct {
  slug: string;
  name: string;
  image: string;
  price: string;
  pricePence: number;
  rating: number;
}

export default function ProductCard({
  product,
}: {
  product: ProductCardProduct;
}) {
  const { isWishlisted, toggleWishlist } = useCommerce();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-200, 200], [10, -10]);
  const rotateY = useTransform(x, [-200, 200], [-10, 10]);
  const slug = product.slug;
  const commerceProduct = {
    slug,
    name: product.name,
    image: product.image,
    pricePence: product.pricePence,
  };
  const wishlisted = isWishlisted(slug);

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
            href={`/products/${slug}`}
          />
          <div className="pointer-events-none absolute inset-x-[14%] bottom-[7%] h-[12%] rounded-full bg-black/10 blur-xl" />
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 80vw, 25vw"
            className="pointer-events-none object-contain p-3 drop-shadow-[0_18px_18px_rgba(48,33,19,0.2)]"
          />
          <button
            type="button"
            onClick={() => toggleWishlist(commerceProduct)}
            aria-label={`${wishlisted ? "Remove" : "Add"} ${product.name} ${wishlisted ? "from" : "to"} wishlist`}
            aria-pressed={wishlisted}
            className={`absolute right-2 top-2 z-20 grid size-9 place-items-center rounded-full border shadow-[0_8px_24px_rgba(42,29,18,0.05)] backdrop-blur-md transition-colors active:bg-[#1A1A1A] active:text-white ${
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
            href={`/products/${slug}`}
          >
            <h3 className="line-clamp-2 font-heading text-base tracking-wide text-[#1A1A1A]">
              {product.name}
            </h3>
          </Link>
          <RatingStars className="mt-1.5" rating={product.rating} size={13} />
          <span className="mt-1 text-[15px] font-bold text-[#1A1A1A]">
            {product.price}
          </span>

          <CartAction
            ariaLabel={`Add ${product.name} to cart`}
            className="mt-2 flex min-h-11 w-full items-center justify-center bg-[#967C55] px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white transition-colors active:bg-[#1A1A1A]"
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
              Add to Cart
            </span>
          </CartAction>
        </div>
      </article>

      <div className="group relative mx-auto hidden w-full max-w-sm cursor-pointer flex-col sm:flex sm:max-w-none [@media(hover:none)]:hidden pointer-coarse:hidden">
        <Link
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#967C55]"
          href={`/products/${slug}`}
        />
        <motion.div
          style={{ perspective: 1200 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="pointer-events-none relative z-30 aspect-3/4 w-full"
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.5,
            }}
            className="w-full h-full relative"
          >
            <div className="absolute inset-10 transition-all duration-700 ease-out bg-white/40 blur-2xl rounded-full">
              <div className="absolute inset-[-10%] bg-linear-to-tr from-[#967C55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-[0.65,0,0.35,1]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square bg-[radial-gradient(circle,rgba(150,124,85,0.08)_0%,transparent_60%)] rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1000 ease-[0.65,0,0.35,1]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-[radial-gradient(circle,rgba(150,124,85,0.15)_0%,transparent_70%)] rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700 ease-[0.65,0,0.35,1] delay-75" />
            </div>

            <div
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
              style={{ transform: "translateZ(80px)" }}
            >
              <div className="relative w-[80%] h-[80%] transition-transform duration-700 ease-[0.65,0,0.35,1] group-hover:scale-110 group-hover:-translate-y-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain transition-transform duration-700"
                />
              </div>
            </div>

            <div
              className="absolute inset-y-0 right-0 w-16 overflow-hidden z-30 pointer-events-none"
              style={{ transform: "translateZ(60px)" }}
            >
              <div className="absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => toggleWishlist(commerceProduct)}
                  aria-pressed={wishlisted}
                  className="signature-card-action flex size-10 translate-x-0 items-center justify-center rounded-full border border-black/5 bg-white/90 text-[#1A1A1A] opacity-100 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white"
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

                <Link
                  href={`/products/${slug}`}
                  className="signature-card-action flex size-10 translate-x-0 items-center justify-center rounded-full border border-black/5 bg-white/90 text-[#1A1A1A] opacity-100 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white"
                  style={{
                    transitionDuration: "500ms",
                    transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
                    transitionDelay: "150ms",
                  }}
                  aria-label="Quick View"
                >
                  <Eye aria-hidden="true" size={16} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="pointer-events-none relative z-30 -mt-3 flex flex-col items-center text-center">
          <h3 className="font-heading text-xl md:text-xl text-[#1A1A1A] tracking-wide mb-1 transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>
          <RatingStars className="mb-1.5" rating={product.rating} size={14} />
          <span className="text-[#1A1A1A] font-bold text-base mb-3">
            {product.price}
          </span>

          <CartAction
            className="group/btn pointer-events-auto relative overflow-hidden bg-[#967C55] px-6 py-3 text-xs uppercase tracking-widest text-white transition-colors"
            inCartClassName="group/btn pointer-events-auto relative overflow-hidden border border-[#967C55]/60 bg-[#f5efe5] px-6 py-3 text-xs uppercase tracking-widest text-[#6f5738] hover:text-white transition-colors hover:border-[#6f5738]"
            product={commerceProduct}
            inCartChildren={
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check aria-hidden="true" size={14} strokeWidth={1.7} />
                  View in cart
                </span>
                <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
              </>
            }
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <ShoppingBag aria-hidden="true" size={14} strokeWidth={2} />
              Add to Cart
            </span>
            <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
          </CartAction>
        </div>
      </div>
    </>
  );
}
