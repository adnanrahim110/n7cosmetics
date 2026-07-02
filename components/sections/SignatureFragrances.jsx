"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { productsContent } from "../../content/products";
import ProductCard from "../ui/ProductCard";

gsap.registerPlugin(ScrollTrigger);

export default function SignatureFragrances() {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const getScrollAmount = () => -(containerRef.current.scrollWidth - window.innerWidth);

      gsap.to(containerRef.current, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${containerRef.current.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen bg-dark-950 flex items-center overflow-hidden border-t border-white/5">
      
      <div className="absolute top-24 left-8 md:left-16 lg:left-24 z-10">
        <h2 className="font-heading text-4xl md:text-6xl text-primary-300 uppercase tracking-widest">
          Signature
          <span className="block text-primary-100 italic font-light lowercase text-3xl md:text-5xl mt-2">fragrances</span>
        </h2>
      </div>

      {/* The horizontal scrolling container */}
      <div 
        ref={containerRef} 
        className="flex gap-8 px-8 md:px-24 mt-32"
        style={{ width: "max-content" }}
      >
        {/* Add an empty padding block to offset the start so it aligns nicely */}
        <div className="w-[10vw] md:w-[20vw] flex-shrink-0" />
        
        {productsContent.signature.map((product) => (
          <div key={product.id} className="w-[280px] md:w-[350px] flex-shrink-0 h-[500px]">
            <ProductCard product={product} />
          </div>
        ))}
        
        {/* End padding */}
        <div className="w-[10vw] md:w-[20vw] flex-shrink-0" />
      </div>
    </section>
  );
}
