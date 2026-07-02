"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { productsContent } from "../../content/products";
import PremiumSlider from "../ui/PremiumSlider";
import ProductCard from "../ui/ProductCard";

gsap.registerPlugin(ScrollTrigger);

export default function RecreationsSlider() {
  const sectionRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(".recreations-title", {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-dark-950 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <h2 className="recreations-title font-heading text-4xl md:text-5xl lg:text-6xl text-primary-300 uppercase tracking-widest">
          Recreations
          <span className="block text-primary-100 italic font-light lowercase text-2xl md:text-3xl mt-3">our masterpieces</span>
        </h2>
      </div>

      <PremiumSlider 
        items={productsContent.recreations}
        coverflow={true}
        renderItem={(product) => (
          <div className="h-[450px]">
            <ProductCard product={product} />
          </div>
        )}
      />
    </section>
  );
}
