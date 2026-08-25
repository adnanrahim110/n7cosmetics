"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import "swiper/css";
import { Autoplay, Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import Button from "@/components/ui/Button";
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
  const activeProduct = recreations[activeIndex];

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
        <div className="grid min-h-[75vh] grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 flex flex-col justify-center pt-8 sm:pt-12 lg:col-span-5 lg:py-12 lg:pl-12 lg:pr-8">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-12 pointer-events-none opacity-[0.02]">
              <h2 className="font-heading text-[8rem] md:text-[16rem] text-black leading-[0.8] tracking-tighter select-none">
                ART WORK
              </h2>
            </div>

            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-8 h-px bg-[#967C55]" />
                <span className="text-[#967C55] font-medium tracking-[0.4em] text-[10px] uppercase">
                  {content.label}
                </span>
              </div>

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
                      <Button className="px-6 py-3 text-xs sm:px-8 sm:py-4 sm:text-sm" href={`/products/${activeProduct.slug}`}>
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
                      href={`/products/${product.slug}`}
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
