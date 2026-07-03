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

// Snappier cinematic ease
const customEase = [0.65, 0, 0.35, 1];

const SplitText = ({ text, delayOffset = 0, className = "" }) => {
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: customEase,
            delay: delayOffset + index * 0.02
          }}
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
    }, 5000);
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
    initial: (dir) => ({
      clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
      scale: 1.05,
      filter: "brightness(0.6) blur(5px)",
      zIndex: 1,
    }),
    animate: {
      clipPath: "inset(0 0 0 0)",
      scale: 1,
      filter: "brightness(0.8) blur(0px)",
      zIndex: 2,
      transition: { duration: 0.8, ease: customEase }
    },
    exit: (dir) => ({
      clipPath: dir > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
      scale: 0.95,
      filter: "brightness(0.4) blur(5px)",
      zIndex: 0,
      transition: { duration: 0.8, ease: customEase }
    })
  };

  const imageVariants = {
    initial: (dir) => ({
      opacity: 0,
      scale: 0.8,
      x: dir > 0 ? "20%" : "-20%",
      filter: "blur(10px)",
    }),
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      filter: "blur(0px)",
      y: [0, -10, 0],
      transition: {
        opacity: { duration: 0.6 },
        scale: { duration: 0.8, ease: customEase },
        x: { duration: 0.8, ease: customEase },
        filter: { duration: 0.6 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
      }
    },
    exit: (dir) => ({
      opacity: 0,
      scale: 1.1,
      x: dir > 0 ? "-20%" : "20%",
      filter: "blur(10px)",
      transition: { duration: 0.6, ease: customEase }
    })
  };

  const textVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (delay) => ({
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: customEase, delay }
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.4, ease: customEase } }
  };

  return (
    <section 
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-24 lg:pt-32 bg-dark-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Fast Wipe Reveal */}
      <AnimatePresence custom={direction} mode="popLayout" initial={false}>
        <motion.div
          key={activeProduct.id + "-bgimg"}
          custom={direction}
          variants={bgVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${activeProduct.bgImage})` }}
        >
          {/* Overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-linear-to-r from-dark-950 via-dark-950/70 to-dark-950/20 mix-blend-multiply" />
        </motion.div>
      </AnimatePresence>

      {/* Supporting Element: Floating Gold Particles globally */}
      <motion.div 
        className="absolute inset-0 z-10 opacity-30 mix-blend-screen pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: "url('/imgs/backgrounds/particles_gold.png')" }}
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{ duration: 120, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
      />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between h-full py-10">
        
        {/* Left Side: Content */}
        <div className="w-full md:w-5/12 flex flex-col items-center text-center md:items-start md:text-left">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeProduct.id} className="w-full">
              
              <div className="mb-4 overflow-hidden">
                <motion.span 
                  variants={textVariants}
                  custom={0.1}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-primary-400 font-medium tracking-[0.3em] text-xs md:text-sm uppercase block"
                >
                  {activeProduct.tagline}
                </motion.span>
              </div>
              
              <h2 className="font-heading text-6xl md:text-8xl text-white mb-6 tracking-tight drop-shadow-2xl leading-[0.9] -ml-1">
                <SplitText text={activeProduct.name} delayOffset={0.2} />
              </h2>
              
              <motion.p 
                variants={textVariants}
                custom={0.4}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-lg md:text-xl text-primary-100/80 mb-10 font-light leading-relaxed max-w-md mx-auto md:mx-0"
              >
                {activeProduct.description}
              </motion.p>
              
              <motion.div
                variants={textVariants}
                custom={0.5}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Button variant="primary" className="text-lg px-8 py-4 relative overflow-hidden group">
                  <span className="relative z-10">Discover {activeProduct.name}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Product Image Showcase */}
        <div className="w-full md:w-7/12 h-[50vh] md:h-[70vh] flex items-center justify-center relative mt-10 md:mt-0">
          <AnimatePresence custom={direction} mode="popLayout" initial={false}>
            <motion.img
              key={activeProduct.id}
              src={activeProduct.image}
              alt={activeProduct.name}
              custom={direction}
              variants={imageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute w-auto h-full max-h-[700px] object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)] z-20"
            />
          </AnimatePresence>
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeProduct.id + "-orb"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.8, ease: customEase }}
              className="absolute w-[50%] h-[50%] rounded-full bg-white/10 blur-[80px] z-10"
            />
          </AnimatePresence>
        </div>

      </div>

      {/* Modern Navigation Controls */}
      <div className="absolute bottom-0 left-0 w-full z-30 pb-8 bg-linear-to-t from-dark-950 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          
          <div className="flex gap-6 items-center">
            <span className="text-white font-heading text-xl w-8">
              {(currentIndex + 1).toString().padStart(2, '0')}
            </span>
            <div className="flex gap-3">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className="relative h-1 transition-all duration-300 overflow-hidden"
                  style={{ width: idx === currentIndex ? "48px" : "16px" }}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <div className="absolute inset-0 bg-white/20" />
                  <motion.div 
                    className="absolute top-0 left-0 bottom-0 bg-white"
                    initial={false}
                    animate={{ width: idx === currentIndex ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </button>
              ))}
            </div>
            <span className="text-white/40 font-heading text-sm w-8">
              {products.length.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={prevSlide}
              className="group w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-md overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <svg className="relative z-10 transition-transform group-hover:-translate-x-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={nextSlide}
              className="group w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-md overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <svg className="relative z-10 transition-transform group-hover:translate-x-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}

