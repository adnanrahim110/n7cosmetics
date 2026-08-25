"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { StorefrontRelatedProduct } from "@/lib/commerce/catalog";

function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default function RelatedProductsSlider({ products }: { products: StorefrontRelatedProduct[] }) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(products.length <= 1);
  if (!products.length) return null;

  const syncControls = (instance: SwiperInstance) => {
    setAtStart(instance.isBeginning);
    setAtEnd(instance.isEnd);
  };

  return (
    <section className="overflow-hidden border-t border-black/10 bg-[#f3eee5] py-16 text-[#1c1814] sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between gap-6 border-b border-black/12 pb-7 sm:pb-9">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8d6745]">Continue exploring</p>
            <h2 className="mt-4 font-heading text-4xl font-normal leading-none text-[#1c1814] sm:text-5xl">You may also <span className="italic text-[#8d6745]">like.</span></h2>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button aria-label="Previous related products" className="grid size-11 place-items-center rounded-full border border-black/18 transition hover:border-black hover:bg-[#1c1814] hover:text-white disabled:cursor-not-allowed disabled:opacity-25" disabled={atStart} onClick={() => swiper?.slidePrev()} type="button"><ArrowLeft size={17} strokeWidth={1.4} /></button>
            <button aria-label="Next related products" className="grid size-11 place-items-center rounded-full border border-black/18 transition hover:border-black hover:bg-[#1c1814] hover:text-white disabled:cursor-not-allowed disabled:opacity-25" disabled={atEnd} onClick={() => swiper?.slideNext()} type="button"><ArrowRight size={17} strokeWidth={1.4} /></button>
          </div>
        </div>

        <Swiper
          aria-label="Related products"
          breakpoints={{
            480: { slidesPerView: 1.6, spaceBetween: 18 },
            720: { slidesPerView: 2.35, spaceBetween: 22 },
            1024: { slidesPerView: 3.2, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 28 },
          }}
          className="mt-8 overflow-visible! sm:mt-10"
          modules={[A11y]}
          onFromEdge={syncControls}
          onReachBeginning={syncControls}
          onReachEnd={syncControls}
          onSlideChange={syncControls}
          onSwiper={(instance) => { setSwiper(instance); syncControls(instance); }}
          slidesPerView={1.25}
          spaceBetween={16}
          watchOverflow
        >
          {products.map((product, index) => (
            <SwiperSlide className="h-auto!" key={product.id}>
              <Link
                aria-label={`View ${product.name}`}
                className="group flex h-full min-h-122 flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d6745]"
                href={`/products/${product.slug}`}
              >
                <div className="relative aspect-3/4 overflow-hidden bg-[#e8dfd1]">
                  <span className="absolute left-4 top-4 z-10 text-[8px] font-semibold uppercase tracking-[0.22em] text-black/34">{String(index + 1).padStart(2, "0")} / N7</span>
                  <span className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-black/10 bg-white/55 text-black/55 opacity-0 backdrop-blur transition-all duration-500 group-hover:opacity-100"><ArrowUpRight size={14} /></span>
                  <div className="absolute inset-[9%] transition-transform duration-700 ease-[0.22,1,0.36,1] group-hover:-translate-y-2 group-hover:scale-[1.045]">
                    <Image alt={product.imageAlt} className="object-contain drop-shadow-[0_30px_24px_rgba(52,34,20,0.2)]" fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 42vw, 23vw" src={product.image} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-black/8 bg-[#eee6da]/88 px-4 py-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-black/45 backdrop-blur">
                    <span>{product.brand ?? "N7 Cosmetics"}</span><span>{product.variantTitle}</span>
                  </div>
                </div>
                <div className="grow border-b border-black/12 py-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8d6745]">{product.audience.toLowerCase()}</p>
                  <h3 className="mt-2 font-heading text-2xl font-normal leading-tight text-[#1c1814] transition-colors group-hover:text-[#8d6745]">{product.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-base font-semibold">{money(product.pricePence)}</span>{product.compareAtPricePence ? <del className="text-xs text-black/35">{money(product.compareAtPricePence)}</del> : null}</div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="mt-7 flex items-center justify-end gap-2 sm:hidden">
          <button aria-label="Previous related products" className="grid size-11 place-items-center rounded-full border border-black/18 disabled:opacity-25" disabled={atStart} onClick={() => swiper?.slidePrev()} type="button"><ArrowLeft size={17} /></button>
          <button aria-label="Next related products" className="grid size-11 place-items-center rounded-full border border-black/18 disabled:opacity-25" disabled={atEnd} onClick={() => swiper?.slideNext()} type="button"><ArrowRight size={17} /></button>
        </div>
      </div>
    </section>
  );
}
