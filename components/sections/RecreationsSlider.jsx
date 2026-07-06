"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Autoplay } from 'swiper/modules';
import Image from "next/image";
import 'swiper/css';

import { productsContent } from "../../content/products";

// Dynamically map real images
const recreations = productsContent.recreations.map((p, i) => ({
  ...p,
  image: `/imgs/products/${(i % 8) + 1}.png`, 
  description: "A meticulously crafted masterpiece inspired by the world's most iconic aromas, elevated with our signature touch."
}));

const customEase = [0.65, 0, 0.35, 1];

export default function RecreationsSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = recreations[activeIndex];

  return (
    <section className="relative py-24 lg:py-32 bg-[#Fdfbf7] overflow-hidden border-t border-black/5">
      
      {/* Subtle background grain for premium light feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[75vh]">
          
          {/* Left Column: Sticky Editorial Info */}
          <div className="lg:col-span-5 relative z-10 flex flex-col justify-center pt-12 lg:py-12 lg:pl-12 lg:pr-8">
            
            {/* Massive Watermark Typography */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-12 pointer-events-none opacity-[0.02]">
              <h2 className="font-heading text-[8rem] md:text-[16rem] text-black leading-[0.8] tracking-tighter select-none">
                ART<br/>WORK
              </h2>
            </div>

            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-8 h-[1px] bg-[#967C55]" />
                <span className="text-[#967C55] font-medium tracking-[0.4em] text-[10px] uppercase">
                  Masterpiece Collection
                </span>
              </div>
              
              {/* Dynamic Text with AnimatePresence */}
              <div className="h-[220px] md:h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
                    transition={{ duration: 0.7, ease: customEase }}
                  >
                    <span className="font-heading text-[#1a1a1a]/20 text-6xl md:text-8xl absolute -top-12 -left-6 -z-10 select-none">
                      {String(activeIndex + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] leading-tight mb-4 tracking-wide">
                      {activeProduct.name}
                    </h3>
                    <p className="font-heading italic text-[#967C55] text-lg md:text-xl mb-6 tracking-wide">
                      {activeProduct.type}
                    </p>
                    <p className="text-[#5a5a5a] text-xs md:text-sm font-light leading-[1.8] max-w-md mb-8">
                      {activeProduct.description}
                    </p>
                    <div className="flex items-center gap-8">
                      <span className="text-xl md:text-2xl text-[#1a1a1a] font-medium tracking-wider">
                        {activeProduct.price}
                      </span>
                      <button className="group/btn relative text-[10px] tracking-[0.3em] uppercase text-[#1a1a1a] flex items-center gap-3 overflow-hidden pb-1">
                        <span className="relative z-10 transition-transform duration-500 ease-out group-hover/btn:-translate-y-full">Discover Details</span>
                        <span className="absolute inset-0 z-20 transition-transform duration-500 ease-out translate-y-full group-hover/btn:translate-y-0 text-[#967C55]">Discover Details</span>
                        <div className="w-6 h-[1px] bg-[#1a1a1a] transition-all duration-500 group-hover/btn:w-10 group-hover/btn:bg-[#967C55]" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Slider Progress */}
              <div className="mt-12 flex items-center gap-4">
                <div className="w-24 h-[1px] bg-[#1a1a1a]/10 relative overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-[#1a1a1a]"
                    animate={{ width: `${((activeIndex + 1) / recreations.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: customEase }}
                  />
                </div>
                <span className="text-[10px] text-[#1a1a1a]/40 tracking-widest font-light">
                  <span className="text-[#1a1a1a] font-medium">{String(activeIndex + 1).padStart(2, '0')}</span> 
                  <span className="mx-1">/</span> 
                  {String(recreations.length).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-[#1a1a1a]/30 uppercase tracking-[0.3em] ml-6 hidden md:flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Swipe
                </span>
              </div>

            </div>
          </div>

          <div 
            className="lg:col-span-7 relative w-full lg:pl-12"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 100%)' }}
          >
            <Swiper
              modules={[Mousewheel, Autoplay]}
              spaceBetween={20} // Reduced gap for a tighter, premium feel
              slidesPerView={1.2}
              grabCursor={true}
              mousewheel={{ forceToAxis: true }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              breakpoints={{
                480: { slidesPerView: 1.5, spaceBetween: 20 },
                768: { slidesPerView: 2.2, spaceBetween: 24 },
                1024: { slidesPerView: 2.2, spaceBetween: 24 },
                1280: { slidesPerView: 2.5, spaceBetween: 30 },
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="!overflow-visible w-full py-12" // added vertical padding to prevent drop-shadow clipping
            >
              {recreations.map((product, index) => {
                const isActive = activeIndex === index;
                return (
                  <SwiperSlide key={product.id} className="pt-10 pb-16">
                    <motion.div 
                      className="relative w-full aspect-[3/4.5] cursor-grab active:cursor-grabbing group"
                      animate={{
                        scale: isActive ? 1 : 0.85,
                        opacity: isActive ? 1 : 0.4,
                        y: isActive ? 0 : 20
                      }}
                      transition={{ duration: 0.7, ease: customEase }}
                    >
                      {/* Deep Floating Shadow */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/15 rounded-[100%] blur-[20px] transition-all duration-700 group-hover:bg-black/25 group-hover:w-full group-hover:blur-[25px]" />
                      
                      {/* Premium Card Container */}
                      <div className="absolute inset-0 bg-[#F9F7F1] shadow-[0_20px_60px_rgba(0,0,0,0.06)] rounded-sm group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)] transition-all duration-700 overflow-hidden border border-[#967C55]/20 flex items-center justify-center p-4">
                        
                        {/* Luxurious Inner Border Frame */}
                        <div className="absolute inset-2 border-[0.5px] border-[#967C55]/30 pointer-events-none transition-transform duration-700 group-hover:scale-[0.98]" />
                        
                        {/* Product Image */}
                        <div className="relative w-full h-[85%] transition-transform duration-1000 ease-[0.65,0,0.35,1] group-hover:scale-110">
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
