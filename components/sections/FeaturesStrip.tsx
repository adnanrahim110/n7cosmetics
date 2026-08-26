"use client";

import { Headphones, ShieldCheck, Truck } from "lucide-react";
import { motion } from "motion/react";

const features = [
  { icon: Truck, title: "Reliable Delivery", subtitle: "Options confirmed at checkout" },
  { icon: ShieldCheck, title: "Secure Payments", subtitle: "Encrypted transactions" },
  { icon: Headphones, title: "24/7 Concierge", subtitle: "Always here for your needs" },
];

export default function FeaturesStrip() {
  return (
    <section className="relative overflow-hidden border-y border-[#1a1a1a]/10 bg-[#FDFCF8] py-12 sm:py-16 md:py-24">
      <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* The Grid with Ultra-Thin Separators */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a]/10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="group flex flex-col items-center px-6 py-10 text-center sm:py-12 md:py-8">
                <div className="relative mb-6 sm:mb-8 md:mb-10">
                  {/* Subtle pulsing background for the icon area on hover */}
                  <div className="absolute inset-0 bg-[#967C55]/5 rounded-full scale-[2] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.82 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-12 text-[#967C55] md:size-16"
                      strokeWidth={0.8}
                    />
                  </motion.div>
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
