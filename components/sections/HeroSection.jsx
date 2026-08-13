"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { homeContent } from "../../content/home";

const revealEase = [0.22, 1, 0.36, 1];
const autoplayDelay = 7000;
const swipeThreshold = 70;

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const pointerStartX = useRef(null);
  const { products, cta } = homeContent.hero;
  const activeProduct = products[activeIndex];
  const entranceOffset = shouldReduceMotion ? 0 : 140;
  const sequence = {
    title: shouldReduceMotion ? 0 : 0.25,
    tagline: shouldReduceMotion ? 0 : 0.85,
    description: shouldReduceMotion ? 0 : 1.1,
    cta: shouldReduceMotion ? 0 : 1.35,
  };

  const showProduct = (index) => {
    const normalizedIndex = (index + products.length) % products.length;

    setActiveIndex((currentIndex) =>
      normalizedIndex === currentIndex ? currentIndex : normalizedIndex,
    );
  };

  useEffect(() => {
    if (products.length < 2 || isDragging) return undefined;

    const autoplayTimer = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % products.length);
    }, autoplayDelay);

    return () => window.clearTimeout(autoplayTimer);
  }, [activeIndex, isDragging, products.length]);

  const handlePointerDown = (event) => {
    if (
      event.button !== 0 ||
      event.target.closest("button, a, input, select, textarea")
    ) {
      return;
    }

    pointerStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishDrag = (event) => {
    if (pointerStartX.current === null) return;

    const dragDistance = event.clientX - pointerStartX.current;

    if (dragDistance <= -swipeThreshold) {
      showProduct(activeIndex + 1);
    } else if (dragDistance >= swipeThreshold) {
      showProduct(activeIndex - 1);
    }

    pointerStartX.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured fragrances"
      onPointerDown={handlePointerDown}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className={`relative min-h-200 select-none overflow-hidden bg-cover bg-center bg-no-repeat ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        backgroundImage: "url(/imgs/hero-bg.png)",
        touchAction: "pan-y",
      }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-linear-to-r from-black/20 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-40 sm:px-6 lg:px-8">
        <AnimatePresence initial mode="wait">
          <motion.div
            key={activeProduct.name}
            aria-live="polite"
            className="text-left"
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
          >
            <div className="relative w-full">
              <motion.h1
                aria-label={activeProduct.name}
                className="block w-full leading-none"
                initial={{
                  clipPath: shouldReduceMotion
                    ? "inset(0% 0% 0% 0%)"
                    : "inset(100% 0% 0% 0%)",
                  y: shouldReduceMotion ? 0 : 28,
                }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", y: 0 }}
                exit={{
                  clipPath: shouldReduceMotion
                    ? "inset(0% 0% 0% 0%)"
                    : "inset(0% 0% 100% 0%)",
                  y: shouldReduceMotion ? 0 : -18,
                  transition: {
                    duration: shouldReduceMotion ? 0 : 0.42,
                    delay: 0,
                    ease: [0.4, 0, 1, 1],
                  },
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.2,
                  delay: sequence.title,
                  ease: revealEase,
                }}
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 1600 340"
                  preserveAspectRatio="xMinYMid meet"
                  className="block h-auto w-full"
                >
                  <defs>
                    <linearGradient
                      id="hero-title-gradient"
                      x1="100%"
                      y1="100%"
                      x2="0%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#b6976f" />
                      <stop offset="100%" stopColor="#fef6e9" />
                    </linearGradient>
                  </defs>
                  <text
                    x="32"
                    y="265"
                    textAnchor="start"
                    textLength="1360"
                    lengthAdjust="spacingAndGlyphs"
                    fill="url(#hero-title-gradient)"
                    fontSize="260"
                    style={{
                      fontFamily: "var(--font-kindred)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {activeProduct.name}
                  </text>
                </svg>
              </motion.h1>
            </div>

            <motion.div
              className="uppercase tracking-[0.2em] text-lg font-medium text-[#dabf9c]"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : -10,
                transition: {
                  duration: shouldReduceMotion ? 0 : 0.28,
                  delay: 0,
                },
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.82,
                delay: sequence.tagline,
                ease: revealEase,
              }}
            >
              {activeProduct.tagline}
            </motion.div>

            <motion.p
              className="my-5 max-w-72 font-heading"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : -10,
                transition: {
                  duration: shouldReduceMotion ? 0 : 0.25,
                  delay: 0,
                },
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.86,
                delay: sequence.description,
                ease: revealEase,
              }}
            >
              {activeProduct.description}
            </motion.p>

            <motion.button
              type="button"
              className="group relative z-10 flex min-w-44 cursor-pointer items-center justify-center gap-3 overflow-hidden border border-[#f7e2bd] bg-linear-to-r from-[#c99a5b] via-[#f2d9ad] to-[#b98448] px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#17120d] shadow-[0_10px_35px_rgba(89,55,21,0.35),0_0_0_1px_rgba(255,245,221,0.25)_inset] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7e2bd]"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 26 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -3,
                      scale: 1.025,
                      boxShadow:
                        "0 16px 42px rgba(89, 55, 21, 0.48), 0 0 24px rgba(242, 217, 173, 0.38)",
                    }
              }
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              exit={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : -10,
                transition: {
                  duration: shouldReduceMotion ? 0 : 0.22,
                  delay: 0,
                },
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.86,
                delay: sequence.cta,
                ease: revealEase,
              }}
            >
              <span className="pointer-events-none relative z-10 flex items-center justify-center gap-2">
                <span>{cta}</span>
                <ArrowRight className="size-4.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
              <span className="absolute inset-0 translate-y-full bg-[#17120d] transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover:translate-y-0" />
              {!shouldReduceMotion && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-5 w-14 -skew-x-20 bg-linear-to-r from-transparent via-white/55 to-transparent blur-[1px]"
                  initial={{ x: "-180%" }}
                  animate={{ x: "420%" }}
                  transition={{
                    duration: 1.15,
                    delay: 2.2,
                    repeat: Infinity,
                    repeatDelay: 3.8,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              )}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <nav
        aria-label="Featured fragrance slides"
        className="absolute inset-y-0 left-8 z-10 flex flex-col items-center justify-center gap-6"
      >
        {products.map((product, index) => {
          const isActive = index === activeIndex;

          return (
            <motion.button
              key={product.name}
              type="button"
              aria-label={`Show ${product.name}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => showProduct(index)}
              className="group relative flex size-3 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5e4cc]"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.3 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            >
              {isActive && (
                <motion.span
                  layoutId="hero-pagination-ring"
                  className="absolute size-5 rounded-full border border-[#f5e4cc]/50"
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.4,
                    ease: revealEase,
                  }}
                />
              )}
              <motion.span
                className="rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-colors duration-300 group-hover:bg-[#f5e4cc]"
                animate={{
                  width: isActive ? 10 : 3,
                  height: isActive ? 10 : 3,
                  backgroundColor: isActive ? "#f5e4cc" : "#ffffff",
                  boxShadow: isActive
                    ? "0 0 18px rgba(245, 228, 204, 0.75)"
                    : "0 0 10px rgba(0, 0, 0, 0.3)",
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  ease: revealEase,
                }}
              />
            </motion.button>
          );
        })}
      </nav>

      <div className="pointer-events-none absolute top-[52%] left-[57%] z-2 aspect-576/1023 w-88 -translate-1/2">
        <AnimatePresence initial>
          <motion.div
            key={activeProduct.image}
            className="absolute inset-0 flex items-center justify-center"
            initial={{
              opacity: 0,
              y: entranceOffset,
              scale: shouldReduceMotion ? 1 : 0.96,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : -90,
              scale: shouldReduceMotion ? 1 : 0.98,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 1.65,
              ease: revealEase,
              opacity: { duration: shouldReduceMotion ? 0 : 1.1 },
            }}
          >
            <Image
              src={activeProduct.image}
              alt={`${activeProduct.name} fragrance bottle`}
              width={576}
              height={1023}
              priority={activeIndex === 0}
              draggable={false}
              className="h-full w-full object-contain"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <Image
        src="/imgs/hero-cloud.png"
        alt=""
        aria-hidden="true"
        width={1672}
        height={941}
        draggable={false}
        className="pointer-events-none absolute -right-32 -bottom-26 z-3 h-auto w-[90vw] brightness-95"
      />
    </section>
  );
};

export default HeroSection;
