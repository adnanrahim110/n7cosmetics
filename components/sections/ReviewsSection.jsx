"use client";

import { useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { homeContent } from "../../content/home";
import { FaQuoteLeft } from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ReviewsSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(".reviews-header", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-dark-900 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center reviews-header">
        <h2 className="font-heading text-3xl md:text-5xl text-primary-300 uppercase tracking-widest mb-4">
          Client Experiences
        </h2>
        <div className="w-24 h-[1px] bg-primary-500 mx-auto" />
      </div>

      <div className="w-full">
        <Swiper
          modules={[Autoplay]}
          loop={true}
          speed={6000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
          }}
          slidesPerView="auto"
          spaceBetween={40}
          allowTouchMove={true}
          className="reviews-marquee"
        >
          {/* Duplicate array to ensure enough slides for continuous loop on large screens */}
          {[...homeContent.reviews, ...homeContent.reviews].map((review, index) => (
            <SwiperSlide key={index} className="max-w-[350px] md:max-w-[450px]">
              <div className="bg-dark-950 p-8 border border-white/10 flex flex-col h-full rounded-sm">
                <FaQuoteLeft className="text-primary-500/50 text-2xl mb-6" />
                <p className="text-dark-200 font-light leading-relaxed mb-8 flex-grow">
                  "{review.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center text-primary-200 font-heading">
                    {review.author.charAt(0)}
                  </div>
                  <span className="ml-4 font-medium text-primary-100 tracking-wide uppercase text-sm">
                    {review.author}
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
