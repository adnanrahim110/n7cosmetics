"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination, Parallax } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PremiumSlider({ items, renderItem, coverflow = false }) {
  return (
    <div className="w-full py-12">
      <Swiper
        effect={coverflow ? "coverflow" : "slide"}
        grabCursor={true}
        centeredSlides={coverflow}
        slidesPerView={coverflow ? "auto" : 1}
        breakpoints={coverflow ? undefined : {
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 30 },
          1280: { slidesPerView: 4, spaceBetween: 40 },
        }}
        coverflowEffect={coverflow ? {
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        } : undefined}
        pagination={{ clickable: true }}
        modules={coverflow ? [EffectCoverflow, Pagination, Parallax] : [Pagination, Navigation, Parallax]}
        className="premium-swiper !pb-12"
      >
        {items.map((item, index) => (
          <SwiperSlide key={item.id || index} className={coverflow ? "max-w-[300px] sm:max-w-[350px]" : ""}>
            {renderItem(item)}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
