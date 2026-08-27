"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import "swiper/css";
import { Autoplay, Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import type { HomepageProduct, RecreationsContent } from "@/lib/homepage/types";

const customEase = [0.65, 0, 0.35, 1] as const;

export default function RecreationsSlider({
  products,
  content,
}: {
  products: HomepageProduct[];
  content: RecreationsContent;
}) {
  const recreations = products.map((product) => ({
    ...product,
    description: content.description,
  }));
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const mobileProductButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobilePanelId = useId();
  const shouldReduceMotion = useReducedMotion();
  const activeProduct = recreations[activeIndex];
  const mobileActiveProduct = recreations[mobileActiveIndex];

  if (!activeProduct || !mobileActiveProduct) return null;

  const selectMobileProduct = (index: number, moveFocus = false) => {
    const nextIndex = Math.min(Math.max(index, 0), recreations.length - 1);
    setMobileActiveIndex(nextIndex);
    window.requestAnimationFrame(() => {
      const button = mobileProductButtonRefs.current[nextIndex];
      button?.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
      if (moveFocus) button?.focus();
    });
  };

  return (
    <section className="relative overflow-hidden border-t border-black/5 bg-[#Fdfbf7] py-16 sm:py-24 lg:py-32">
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative lg:hidden">
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-px w-8 shrink-0 bg-[#967C55]" />
                <span className="truncate text-[9px] font-semibold uppercase tracking-[0.32em] text-[#967C55]">
                  {content.label}
                </span>
              </div>
            </div>

            <Title
              className="mt-5"
              highlight={content.titleAccent}
              text={`${content.titleLead} ${content.titleAccent}`}
              tone="charcoal"
            />
            <p className="mt-5 max-w-2xl text-[13px] font-light leading-6 text-[#5a5a5a] sm:text-sm sm:leading-7">
              {content.description}
            </p>
          </div>

          <p aria-live="polite" className="sr-only">
            {mobileActiveProduct.name} selected, product {mobileActiveIndex + 1}{" "}
            of {recreations.length}.
          </p>

          <div
            aria-label="Selected fragrance"
            className="relative overflow-hidden border border-[#967C55]/18 bg-[#eee7dc] shadow-[0_24px_70px_-38px_rgba(46,33,22,0.48)]"
            id={mobilePanelId}
            role="region"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.article
                animate={{ opacity: 1, x: 0 }}
                aria-labelledby={`${mobilePanelId}-title`}
                className="md:grid md:grid-cols-[1.08fr_0.92fr]"
                exit={
                  shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -24 }
                }
                initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
                key={mobileActiveProduct.id}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.42,
                  ease: customEase,
                }}
              >
                <div className="relative aspect-4/3 overflow-hidden border-b border-black/7 bg-[radial-gradient(circle_at_50%_38%,#fff_0%,#f2ebe1_43%,#dfd3c3_100%)] md:aspect-auto md:min-h-120 md:border-b-0 md:border-r">
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-[48%] aspect-square w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#967C55]/12"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-[48%] aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[11%] left-1/2 h-6 w-[52%] -translate-x-1/2 rounded-full bg-black/14 blur-xl"
                  />
                  <motion.div
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute inset-0"
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, scale: 0.94, y: 12 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.58,
                      delay: shouldReduceMotion ? 0 : 0.06,
                      ease: customEase,
                    }}
                  >
                    <Image
                      alt={mobileActiveProduct.name}
                      className="object-contain drop-shadow-[0_28px_24px_rgba(42,28,18,0.22)]"
                      fill
                      sizes="(max-width: 767px) 92vw, 52vw"
                      src={mobileActiveProduct.image}
                    />
                  </motion.div>
                </div>

                <div className="flex flex-col justify-between bg-[#17130f] p-4 pt-3 text-[#f5eee5] sm:p-7 md:p-8">
                  <div>
                    <h3
                      className="font-heading text-[2rem] leading-[0.98] tracking-normal text-[#f5eee5] sm:text-[2.6rem]"
                      id={`${mobilePanelId}-title`}
                    >
                      {mobileActiveProduct.name}
                    </h3>
                    <p className="mt-2 font-heading text-base font-light italic text-[#c6a276]">
                      {mobileActiveProduct.tagline}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <span className="block text-[8px] font-semibold uppercase tracking-[0.24em] text-white/35">
                          {content.priceLabel}
                        </span>
                        <span className="mt-1 block text-2xl font-medium tracking-wide text-white">
                          {mobileActiveProduct.price}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="mt-5 min-h-12 w-full bg-[#c99555] px-5 py-3 text-[10px] text-[#17130f] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c99555]"
                      href={
                        mobileActiveProduct.href ??
                        `/products/${mobileActiveProduct.slug}`
                      }
                    >
                      <span className="flex items-center gap-3">
                        {content.ctaLabel}
                        <ChevronRight
                          aria-hidden="true"
                          size={15}
                          strokeWidth={1.6}
                        />
                      </span>
                    </Button>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="mt-8 sm:mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#1a1a1a]">
                  {content.selectorTitle}
                </p>
                <p className="mt-1 text-[11px] text-black/42">
                  {content.selectorDescription}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label="Previous fragrance"
                  className="grid size-11 place-items-center rounded-full border border-black/12 text-[#1a1a1a] transition-colors hover:border-[#967C55] hover:text-[#967C55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] disabled:cursor-not-allowed disabled:opacity-25"
                  disabled={mobileActiveIndex === 0}
                  onClick={() => selectMobileProduct(mobileActiveIndex - 1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
                </button>
                <button
                  aria-label="Next fragrance"
                  className="grid size-11 place-items-center rounded-full border border-black/12 text-[#1a1a1a] transition-colors hover:border-[#967C55] hover:text-[#967C55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] disabled:cursor-not-allowed disabled:opacity-25"
                  disabled={mobileActiveIndex === recreations.length - 1}
                  onClick={() => selectMobileProduct(mobileActiveIndex + 1)}
                  type="button"
                >
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            </div>

            <div
              aria-label="Fragrance index"
              className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3 pr-[22vw] touch-pan-x scrollbar-none sm:-mx-6 sm:px-6 sm:pr-[15vw] [&::-webkit-scrollbar]:hidden"
              role="group"
            >
              {recreations.map((product, index) => {
                const isSelected = mobileActiveIndex === index;
                return (
                  <button
                    aria-controls={mobilePanelId}
                    aria-label={`Show ${product.name}, ${index + 1} of ${recreations.length}`}
                    aria-pressed={isSelected}
                    className={`group/index min-w-[7.35rem] snap-start border p-2 text-left transition-[border-color,background-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] sm:min-w-34 ${
                      isSelected
                        ? "border-[#967C55]/55 bg-white shadow-[0_12px_28px_-20px_rgba(64,43,24,0.5)]"
                        : "border-black/7 bg-[#f8f4ed]"
                    }`}
                    key={product.id}
                    onClick={() => selectMobileProduct(index)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight") {
                        event.preventDefault();
                        selectMobileProduct(index + 1, true);
                      }
                      if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        selectMobileProduct(index - 1, true);
                      }
                      if (event.key === "Home") {
                        event.preventDefault();
                        selectMobileProduct(0, true);
                      }
                      if (event.key === "End") {
                        event.preventDefault();
                        selectMobileProduct(recreations.length - 1, true);
                      }
                    }}
                    ref={(element) => {
                      mobileProductButtonRefs.current[index] = element;
                    }}
                    type="button"
                  >
                    <span
                      className={`relative block aspect-square overflow-hidden ${isSelected ? "bg-[#eee5d8]" : "bg-[#eee9e1]"}`}
                    >
                      <Image
                        alt=""
                        className="object-contain p-2.5 transition-transform duration-500 group-hover/index:scale-105"
                        fill
                        sizes="136px"
                        src={product.image}
                      />
                    </span>
                    <span className="mt-2 flex items-start justify-between gap-2">
                      <span
                        className={`line-clamp-2 text-[10px] font-medium leading-4 ${isSelected ? "text-[#1a1a1a]" : "text-black/48"}`}
                      >
                        {product.name}
                      </span>
                      <span
                        className={`mt-1 size-1.5 shrink-0 rounded-full ${isSelected ? "bg-[#967C55]" : "bg-black/12"}`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 h-px overflow-hidden bg-black/8">
              <motion.span
                animate={{
                  width: `${((mobileActiveIndex + 1) / recreations.length) * 100}%`,
                }}
                className="block h-full bg-[#967C55]"
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  ease: customEase,
                }}
              />
            </div>
          </div>
        </div>

        <div className="hidden min-h-[75vh] grid-cols-1 items-center gap-8 sm:gap-12 lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 flex flex-col justify-center pt-8 sm:pt-12 lg:col-span-5 lg:py-12 lg:pl-12 lg:pr-8">
            <div
              aria-hidden="true"
              className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-12 pointer-events-none opacity-[0.02]"
            >
              <span className="font-heading text-[8rem] md:text-[16rem] text-black leading-[0.8] tracking-tighter select-none">
                {`${content.titleLead} ${content.titleAccent}`.toUpperCase()}
              </span>
            </div>

            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-8 h-px bg-[#967C55]" />
                <span className="text-[#967C55] font-medium tracking-[0.4em] text-[10px] uppercase">
                  {content.label}
                </span>
              </div>

              <Title
                className="mb-8 uppercase"
                highlight={content.titleAccent}
                highlightClassName="lowercase"
                text={`${content.titleLead} ${content.titleAccent}`}
                tone="charcoal"
              />

              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
                    transition={{ duration: 0.7, ease: customEase }}
                  >
                    <span className="font-heading text-[#1a1a1a]/20 text-6xl md:text-8xl absolute -top-12 -left-6 -z-10 select-none">
                      {String(activeIndex + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mb-4 font-heading text-3xl leading-tight tracking-wide text-[#1a1a1a] sm:text-4xl md:text-5xl lg:text-6xl">
                      {activeProduct.name}
                    </h3>
                    <p className="font-heading italic text-[#967C55] text-lg md:text-xl mb-6 tracking-wide">
                      {activeProduct.type}
                    </p>
                    <p className="text-[#5a5a5a] text-xs md:text-sm font-light leading-[1.8] max-w-md mb-8">
                      {activeProduct.description}
                    </p>
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
                      <span className="text-xl md:text-2xl text-[#1a1a1a] font-medium tracking-wider">
                        {activeProduct.price}
                      </span>
                      <Button
                        className="px-6 py-3 text-xs sm:px-8 sm:py-4 sm:text-sm"
                        href={
                          activeProduct.href ??
                          `/products/${activeProduct.slug}`
                        }
                      >
                        <span className="flex items-center gap-3">
                          {content.ctaLabel}
                        </span>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <div className="w-24 h-px bg-[#1a1a1a]/10 relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-[#1a1a1a]"
                    animate={{
                      width: `${((activeIndex + 1) / recreations.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: customEase }}
                  />
                </div>
                <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest font-light">
                  <span className="text-[#1a1a1a] font-medium">
                    {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-1">/</span>
                  {String(recreations.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          <div className="recreations-slider-mask relative w-full lg:col-span-7 lg:pl-12">
            <Swiper
              modules={[Mousewheel, Autoplay]}
              loop={recreations.length >= 6}
              spaceBetween={20}
              slidesPerView={1.2}
              grabCursor={true}
              mousewheel={{ forceToAxis: true }}
              // autoplay={{
              //   delay: 4000,
              //   disableOnInteraction: false,
              //   pauseOnMouseEnter: true,
              // }}
              breakpoints={{
                480: { slidesPerView: 1.5, spaceBetween: 20 },
                768: { slidesPerView: 2.2, spaceBetween: 24 },
                1024: { slidesPerView: 2.2, spaceBetween: 24 },
                1280: { slidesPerView: 2.5, spaceBetween: 30 },
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              className="overflow-visible! w-full py-12"
            >
              {recreations.map((product, index) => {
                const isActive = activeIndex === index;
                return (
                  <SwiperSlide key={product.id} className="pt-10 pb-16">
                    <Link
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`View ${product.name}`}
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#967C55]"
                      href={product.href ?? `/products/${product.slug}`}
                    >
                      <motion.div
                        className="relative aspect-3/4.5 w-full cursor-pointer active:cursor-grabbing"
                        animate={{
                          scale: isActive ? 1 : 0.85,
                          opacity: isActive ? 1 : 0.4,
                          y: isActive ? 0 : 20,
                        }}
                        transition={{ duration: 0.7, ease: customEase }}
                      >
                        <div className="absolute -bottom-8 left-1/2 h-6 w-4/5 -translate-x-1/2 rounded-[100%] bg-black/15 blur-[20px] transition-all duration-700 group-hover:w-full group-hover:bg-black/25 group-hover:blur-[25px]" />

                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-sm border border-[#967C55]/20 bg-[#F9F7F1] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-700 group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
                          <div className="pointer-events-none absolute inset-2 border-[0.5px] border-[#967C55]/30 transition-transform duration-700 group-hover:scale-[0.98]" />

                          <div className="relative h-[85%] w-full transition-transform duration-1000 ease-[0.65,0,0.35,1] group-hover:scale-110">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, 50vw"
                              className="object-contain drop-shadow-2xl"
                            />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
