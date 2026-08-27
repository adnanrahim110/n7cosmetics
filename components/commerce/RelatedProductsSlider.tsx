"use client";

import ProductCard from "@/components/ui/ProductCard";
import Title from "@/components/ui/Title";
import type { StorefrontRelatedProduct } from "@/lib/commerce/catalog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

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
            <Title
              className="mt-4"
              highlight="like."
              text="You may also like."
              tone="ink"
            />
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
          {products.map((product) => (
            <SwiperSlide className="h-auto!" key={product.id}>
              <ProductCard
                product={{
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  price: money(product.pricePence),
                  pricePence: product.pricePence,
                  rating: product.rating,
                  inspiredBy: product.inspiredBy,
                  audience: product.audience,
                }}
              />
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
