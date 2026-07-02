"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { homeContent } from "../../content/home";
import { motion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export default function CategoryShowcase() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(gridRef.current.children, {
        opacity: 0,
        y: 50,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Using a bento grid pattern
  const gridClasses = [
    "md:col-span-2 md:row-span-2", // Large primary feature
    "md:col-span-1 md:row-span-1", // Secondary
    "md:col-span-1 md:row-span-1", // Secondary
    "md:col-span-2 md:row-span-1", // Wide feature
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl md:text-5xl text-primary-300 uppercase tracking-widest mb-4">
            Curated Collections
          </h2>
          <p className="text-dark-300 max-w-2xl mx-auto">Explore our finest selections curated for distinct personalities and unique tastes.</p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-4 md:gap-6">
          {homeContent.features.map((feature, index) => (
            <motion.div 
              key={index}
              whileHover="hover"
              className={`relative group overflow-hidden rounded-sm bg-dark-900 border border-white/10 ${gridClasses[index] || "md:col-span-1 md:row-span-1"}`}
            >
              {/* Optional Placeholder Image Background */}
              <div className="absolute inset-0 bg-dark-900 transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent opacity-80" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <motion.div
                  variants={{
                    hover: { y: -10 }
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <h3 className="font-heading text-2xl md:text-3xl text-primary-100 mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-primary-300/80 text-sm md:text-base font-light tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {feature.description}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
