"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Button from "../ui/Button";

const products = [
  {
    id: 1,
    name: "Aura N°1",
    tagline: "The Essence of Luxury",
    description: "A majestic blend of rich agarwood and subtle spices, crafted for those who demand excellence.",
    image: "/imgs/products/1.png",
    bgImage: "/imgs/backgrounds/bg_aura.png",
  },
  {
    id: 2,
    name: "Velvet Rose",
    tagline: "Elegance in the Dark",
    description: "A dark, mysterious floral arrangement that blooms at midnight. Unforgettable and alluring.",
    image: "/imgs/products/2.png",
    bgImage: "/imgs/backgrounds/bg_rose.png",
  },
  {
    id: 3,
    name: "Oceanic Mist",
    tagline: "Freshness Redefined",
    description: "Capture the essence of the wild ocean. Crisp, clean, and endlessly refreshing.",
    image: "/imgs/products/3.png",
    bgImage: "/imgs/backgrounds/bg_ocean.png",
  }
];

// Ultra-smooth cinematic ease for massive elements
const cinematicEase = [0.25, 1, 0.35, 1];

const SplitText = ({ text, delayOffset = 0, className = "" }) => {
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ y: "120%", opacity: 0, rotateX: -45 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: "-120%", opacity: 0, rotateX: 45 }}
          transition={{
            duration: 1.2,
            ease: cinematicEase,
            delay: delayOffset + index * 0.04
          }}
          style={{ transformOrigin: "bottom center" }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000); // Slower, more cinematic pacing
    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const activeProduct = products[currentIndex];

  const bgVariants = {
    initial: { opacity: 0, scale: 1.1, filter: "brightness(0.3) blur(10px)" },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "brightness(0.6) blur(0px)",
      transition: { duration: 1.5, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      filter: "brightness(0.2) blur(10px)",
      transition: { duration: 1.2, ease: "easeIn" }
    }
  };

  const bottleVariants = {
    initial: (dir) => ({
      opacity: 0,
      y: 300,
      scale: 0.8,
      rotate: dir > 0 ? 5 : -5,
      filter: "blur(20px)"
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      filter: "blur(0px)",
      transition: { duration: 1.4, ease: cinematicEase }
    },
    exit: (dir) => ({
      opacity: 0,
      y: -200,
      scale: 1.1,
      rotate: dir > 0 ? -5 : 5,
      filter: "blur(20px)",
      transition: { duration: 1.2, ease: cinematicEase }
    })
  };

  const textVariants = {
    initial: { opacity: 0, y: 40 },
    animate: (delay) => ({
      opacity: 1, 
      y: 0,
      transition: { duration: 1, ease: cinematicEase, delay }
    }),
    exit: { opacity: 0, y: -40, transition: { duration: 0.6, ease: cinematicEase } }
  };

  return (
    <section 
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Immersive Atmospheric Background Layer */}
      <AnimatePresence initial={false}>
        <motion.div
          key={activeProduct.id + "-bg"}
          variants={bgVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${activeProduct.bgImage})` }}
        >
          {/* Peaceful Ambient Fluid Gradient Overlay */}
          <motion.div 
            className="absolute inset-0 mix-blend-overlay opacity-50 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)]"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* 2. Content Layer (Left Bottom) */}
      <div className="absolute bottom-[15vh] left-[5%] lg:left-[10%] w-[90%] md:w-[50%] lg:w-[45%] flex flex-col items-start justify-end z-30 pointer-events-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeProduct.id + "-text"} className="flex flex-col items-start text-left w-full">
            
            <motion.span 
              variants={textVariants}
              custom={0.2}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-primary-300 font-medium tracking-[0.4em] text-xs md:text-sm uppercase mb-4 drop-shadow-lg"
            >
              {activeProduct.tagline}
            </motion.span>
            
            {/* Editorial Text - Left Aligned */}
            <h2 className="font-heading text-6xl md:text-7xl lg:text-8xl xl:text-[8rem] text-white tracking-tighter drop-shadow-2xl leading-[0.9] uppercase opacity-95">
              <SplitText text={activeProduct.name} delayOffset={0.3} className="text-left" />
            </h2>
            
            <motion.p 
              variants={textVariants}
              custom={0.8}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-base md:text-lg text-white/80 mt-6 font-light leading-relaxed max-w-md drop-shadow-md"
            >
              {activeProduct.description}
            </motion.p>
            
            {/* CTA Button (Interactive) */}
            <motion.div
              variants={textVariants}
              custom={1.2}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-8 pointer-events-auto"
            >
              <Button variant="primary" className="text-sm md:text-base px-10 py-5 relative overflow-hidden group tracking-[0.2em] uppercase font-medium bg-white text-black hover:text-white border-none shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <span className="relative z-10">Discover {activeProduct.name}</span>
                <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              </Button>
            </motion.div>
            
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Hero Bottle Layer (Right Center) */}
      <div className="absolute right-[5%] lg:right-[10%] top-1/2 -translate-y-1/2 w-[80%] md:w-[45%] lg:w-[40%] h-[60vh] md:h-[75vh] flex justify-center items-center pointer-events-none z-20 mt-10 md:mt-0">
        <AnimatePresence custom={direction} initial={false}>
           <motion.img 
             key={activeProduct.id + "-bottle"}
             custom={direction}
             variants={bottleVariants}
             initial="initial"
             animate="animate"
             exit="exit"
             src={activeProduct.image}
             alt={activeProduct.name}
             className="absolute h-full w-auto object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] will-change-transform"
           />
        </AnimatePresence>
      </div>

      {/* 4. Minimalist Navigation Controls */}
      <div className="absolute bottom-8 left-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          
          <div className="flex gap-8 items-center">
            <span className="text-white/90 font-heading text-lg">
              {(currentIndex + 1).toString().padStart(2, '0')}
            </span>
            <div className="flex gap-4">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className="relative h-[2px] transition-all duration-500 overflow-hidden group py-4"
                  style={{ width: idx === currentIndex ? "64px" : "24px" }}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-white/20 group-hover:bg-white/40 transition-colors" />
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    initial={false}
                    animate={{ width: idx === currentIndex ? "100%" : "0%" }}
                    transition={{ duration: 0.6, ease: cinematicEase }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <button 
              onClick={prevSlide}
              className="group text-white/50 hover:text-white transition-colors uppercase tracking-[0.2em] text-[10px] font-medium flex items-center gap-2"
            >
              <span className="w-8 h-[1px] bg-white/50 group-hover:bg-white transition-colors" />
              Prev
            </button>
            <button 
              onClick={nextSlide}
              className="group text-white/50 hover:text-white transition-colors uppercase tracking-[0.2em] text-[10px] font-medium flex items-center gap-2"
            >
              Next
              <span className="w-8 h-[1px] bg-white/50 group-hover:bg-white transition-colors" />
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}
