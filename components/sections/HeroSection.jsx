"use client";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import React from "react";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-200 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url(/imgs/hero-bg.png)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-linear-to-r from-black/20 via-transparent to-transparent" />
      <div className="mx-auto w-full max-w-7xl relative z-1 px-4 sm:px-6 lg:px-8 pt-40">
        <div className="text-left">
          <h1 className="text-[260px] leading-none text-center font-kindred tracking-tight text-transparent bg-clip-text bg-linear-to-tl from-[#b6976f] to-[#fef6e9]">
            AURA <span className="inline-block ml-28">N°I</span>
          </h1>
          <div className="uppercase tracking-[0.2em] text-lg font-medium text-[#dabf9c]">
            essence of elegance
          </div>
          <p className="max-w-72 my-5 font-heading">
            A timeless fragrance that captures the luminous essence of style,
            confidence, and sophistication.
          </p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative flex items-center justify-center gap-2 overflow-hidden bg-transparent border border-[#1A1A1A] text-[#1A1A1A] px-6 py-3 text-sm font-medium tracking-wider uppercase transition-colors hover:text-white"
          >
            <div className="flex items-center justify-center gap-2 relative z-10 pointer-events-none">
              <span>Discover Aura N°I</span>
              <ArrowRight className="size-4 transition-all duration-200 group-hover:translate-x-1" />
            </div>
            <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
          </motion.button>
        </div>
      </div>
      <div className="absolute inset-y-0 left-8 flex flex-col gap-6 items-center justify-center">
        <span className="size-2.5 shadow-[0_0_40px] shadow-black/30 rounded-full bg-[#f5e4cc]" />
        <span className="size-0.75 shadow-[0_0_40px] shadow-black/30 rounded-full bg-white" />
        <span className="size-0.75 shadow-[0_0_40px] shadow-black/30 rounded-full bg-white" />
        <span className="size-0.75 shadow-[0_0_40px] shadow-black/30 rounded-full bg-white" />
        <span className="size-0.75 shadow-[0_0_40px] shadow-black/30 rounded-full bg-white" />
        <span className="size-0.75 shadow-[0_0_40px] shadow-black/30 rounded-full bg-white" />
      </div>
      <Image
        src="/imgs/hero-per.png"
        alt=""
        width={1080}
        height={1080}
        className="absolute z-2 w-88 h-auto top-[52%] left-[57%] -translate-1/2"
      />
      <img
        src="/imgs/hero-cloud.png"
        alt=""
        className="absolute z-3 -right-32 -bottom-26 w-[90vw] h-auto brightness-95"
      />
    </section>
  );
};

export default HeroSection;
