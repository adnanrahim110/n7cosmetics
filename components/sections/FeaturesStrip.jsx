"use client";

import { motion } from "motion/react";

// Common animation properties for the SVG paths
const svgProps = {
  initial: { pathLength: 0, opacity: 0 },
  whileInView: { pathLength: 1, opacity: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 2, ease: "easeInOut" }
};

// Custom Literal Line Icons
const TruckIcon = () => (
  <svg className="w-12 h-12 md:w-16 md:h-16 text-[#967C55]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
    <motion.path {...svgProps} d="M8 19a2 2 0 100-4 2 2 0 000 4z" />
    <motion.path {...svgProps} d="M15.5 19a2 2 0 100-4 2 2 0 000 4z" />
    <motion.path {...svgProps} d="M3 11V5a2 2 0 012-2h10v12" />
    <motion.path {...svgProps} d="M15 9h3.75a2 2 0 011.66 2.8l-1.5 2.2H15V9z" />
    <motion.path {...svgProps} d="M3 15h2" transition={{ duration: 1, ease: "easeOut", delay: 1 }} />
    <motion.path {...svgProps} d="M10 15h3.5" transition={{ duration: 1, ease: "easeOut", delay: 1 }} />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-12 h-12 md:w-16 md:h-16 text-[#967C55]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
    <motion.path {...svgProps} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <motion.path {...svgProps} d="M9 12l2 2 4-4" transition={{ duration: 1, ease: "easeOut", delay: 1.5 }} />
  </svg>
);

const HeadsetIcon = () => (
  <svg className="w-12 h-12 md:w-16 md:h-16 text-[#967C55]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
    <motion.path {...svgProps} d="M3 18v-6a9 9 0 0118 0v6" />
    <motion.path {...svgProps} d="M21 19a2 2 0 01-2 2h-1v-5h3v3z" />
    <motion.path {...svgProps} d="M3 19a2 2 0 002 2h1v-5H3v3z" />
    <motion.path {...svgProps} d="M16 19h-2a3 3 0 01-3-3" transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} />
  </svg>
);

const features = [
  { icon: TruckIcon, title: "Worldwide Shipping", subtitle: "Fast & reliable courier service" },
  { icon: ShieldIcon, title: "Secure Payments", subtitle: "Encrypted global transactions" },
  { icon: HeadsetIcon, title: "24/7 Concierge", subtitle: "Always here for your needs" },
];

export default function FeaturesStrip() {
  return (
    <section className="py-24 bg-[#FDFCF8] border-t border-b border-[#1a1a1a]/10 overflow-hidden relative">
      <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* The Grid with Ultra-Thin Separators */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a]/10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center py-16 md:py-8 px-6 group">
                <div className="mb-10 relative">
                  {/* Subtle pulsing background for the icon area on hover */}
                  <div className="absolute inset-0 bg-[#967C55]/5 rounded-full scale-[2] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                  <Icon />
                </div>
                <h4 className="font-heading text-lg md:text-xl text-[#1a1a1a] tracking-[0.2em] uppercase mb-4 transition-colors duration-500 group-hover:text-[#967C55]">
                  {feature.title}
                </h4>
                <p className="text-[#1a1a1a]/50 text-[10px] md:text-xs font-light tracking-[0.1em] uppercase">
                  {feature.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
