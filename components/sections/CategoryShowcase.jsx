"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { homeContent } from "../../content/home";

const customEase = [0.65, 0, 0.35, 1];

const bgImages = [
  "/imgs/categories/cat_exotic.png",
  "/imgs/categories/cat_royal.png",
  "/imgs/categories/cat_unforgettable.png",
  "/imgs/categories/cat_masculine.png"
];

export default function CategoryShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState(0);

  return (
    <section className="relative py-24 overflow-hidden bg-black transition-colors duration-1000">
      
      {/* 
        Dynamic Ambient Background: 
        Cross-fades between heavily blurred versions of the category images 
        to perfectly match the hovered accordion panel.
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={hoveredIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${bgImages[hoveredIndex]})`,
              filter: "blur(60px) saturate(1.5)"
            }}
          />
        </AnimatePresence>
        
        {/* Vignette / Dark Gradient to ensure text readability */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        
        {/* Subtle Film Grain */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-16 text-center">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase }}
            className="text-white/60 font-medium tracking-[0.2em] text-sm uppercase mb-4 block"
          >
            Curated Collections
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.1 }}
            className="font-heading text-4xl md:text-5xl text-white uppercase tracking-widest mb-4 drop-shadow-lg"
          >
            Obsidian <span className="text-white/50 italic lowercase font-light">Gallery</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto font-light"
          >
            Explore our finest selections curated for distinct personalities and unique tastes.
          </motion.p>
        </div>

        {/* The Accordion Container - Clean, no borders, relying on pure contrast */}
        <div className="flex flex-col lg:flex-row h-[70vh] lg:h-[650px] w-full gap-1 lg:gap-2">
          {homeContent.features.map((feature, index) => {
            const isActive = hoveredIndex === index;
            
            return (
              <motion.div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => setHoveredIndex(index)}
                className="relative cursor-pointer overflow-hidden rounded-xl bg-black group"
                animate={{
                  flex: isActive ? 6 : 1,
                }}
                transition={{ duration: 0.8, ease: customEase }}
              >
                {/* Background Image */}
                <motion.div 
                  className="absolute inset-0 bg-cover bg-center origin-center"
                  style={{ backgroundImage: `url(${bgImages[index]})` }}
                  animate={{
                    scale: isActive ? 1 : 1.1,
                    opacity: isActive ? 1 : 0.4,
                    filter: isActive ? "grayscale(0%)" : "grayscale(100%)"
                  }}
                  transition={{ duration: 0.8, ease: customEase }}
                />
                
                {/* Inner Shadows for depth */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity duration-700 pointer-events-none" />

                {/* Content Container */}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
                  
                  {/* Vertical Title (when collapsed) */}
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none hidden lg:flex"
                    animate={{ opacity: isActive ? 0 : 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className="font-heading text-2xl text-white/50 tracking-widest whitespace-nowrap -rotate-90">
                      {feature.title}
                    </h3>
                  </motion.div>

                  {/* Active Content */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 40
                    }}
                    transition={{ 
                      duration: 0.6, 
                      ease: customEase,
                      delay: isActive ? 0.2 : 0 
                    }}
                    className="relative z-10 lg:w-[450px] max-w-full"
                  >
                    <h3 className="font-heading text-3xl md:text-5xl text-white mb-4 leading-tight drop-shadow-xl">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 text-sm md:text-lg font-light tracking-wide mb-8 line-clamp-2 md:line-clamp-none drop-shadow-md">
                      {feature.description}
                    </p>
                    
                    <button 
                      className="group/btn relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white text-white hover:text-black px-8 py-4 text-xs tracking-[0.2em] uppercase transition-all duration-500 rounded-sm"
                      tabIndex={isActive ? 0 : -1}
                    >
                      <span className="relative z-10 flex items-center gap-3 font-medium">
                        Explore Collection
                        <svg className="transform group-hover/btn:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
