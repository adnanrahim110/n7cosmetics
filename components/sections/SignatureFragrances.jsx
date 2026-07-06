"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { productsContent } from "../../content/products";

const customEase = [0.65, 0, 0.35, 1];

const NextLevelProductCard = ({ product }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-200, 200], [10, -10]);
  const rotateY = useTransform(x, [-200, 200], [-10, 10]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="group relative w-full cursor-pointer flex flex-col gap-2">
      <motion.div
        style={{ perspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-3/4"
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.5,
          }}
          className="w-full h-full relative"
        >
          <div className="absolute inset-0 border-[0.5px] border-[#1A1A1A]/5 group-hover:border-[#967C55]/30 transition-all duration-700 ease-out overflow-hidden bg-white/40 backdrop-blur-md">
            <div className="absolute inset-[-10%] bg-linear-to-tr from-[#967C55]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-[0.65,0,0.35,1]" />
            {/* Soft Ambient Aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square bg-[radial-gradient(circle,rgba(150,124,85,0.08)_0%,transparent_60%)] rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1000 ease-[0.65,0,0.35,1]" />
            {/* Core Spotlight Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-[radial-gradient(circle,rgba(150,124,85,0.15)_0%,transparent_70%)] rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700 ease-[0.65,0,0.35,1] delay-75" />
          </div>

          <div
            className="absolute top-1 left-3 z-30"
            style={{ transform: "translateZ(30px)" }}
          >
            <span className="text-[10px] tracking-[0.3em] text-[#967C55] uppercase font-bold drop-shadow-sm">
              {product.type}
            </span>
          </div>

          <div
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ transform: "translateZ(80px)" }}
          >
            <div className="relative w-[80%] h-[80%] transition-transform duration-700 ease-[0.65,0,0.35,1] group-hover:scale-110 group-hover:-translate-y-4">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-contain transition-transform duration-700"
              />
            </div>
          </div>

          <div
            className="absolute inset-y-0 right-0 w-16 overflow-hidden z-30 pointer-events-none"
            style={{ transform: "translateZ(60px)" }}
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
              <button
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white duration-300 shadow-lg translate-x-3.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all"
                style={{
                  transitionDuration: "500ms",
                  transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
                  transitionDelay: "100ms",
                }}
                aria-label="Add to Wishlist"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <button
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white duration-300 shadow-lg translate-x-3.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all"
                style={{
                  transitionDuration: "500ms",
                  transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
                  transitionDelay: "150ms",
                }}
                aria-label="Quick View"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="flex flex-col items-center text-center px-2 z-10 relative">
        <h3 className="font-heading text-xl md:text-xl text-[#1A1A1A] tracking-wide mb-1 group-hover:text-[#967C55] transition-colors duration-300 line-clamp-1">
          {product.name}
        </h3>
        <span className="text-[#1A1A1A] font-bold text-base mb-3">
          {product.price}
        </span>

        <button className="relative overflow-hidden w-full max-w-55 bg-[#967C55] text-white group/btn px-6 py-3 text-xs uppercase tracking-widest transition-colors">
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Add to Cart
          </span>
          <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
        </button>
      </div>
    </div>
  );
};

export default function SignatureFragrances() {
  const products = productsContent.signature.map((product, index) => ({
    ...product,
    image: `/imgs/products/${index + 1}.png`,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: customEase } },
  };

  return (
    <section className="relative min-h-screen bg-[#FDFCF8] py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-125 bg-linear-to-b from-[#F2EFE8] to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-24 gap-8">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: customEase }}
              className="text-[#967C55] font-medium tracking-[0.2em] text-sm uppercase mb-4 block"
            >
              The Masterpiece Collection
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: customEase, delay: 0.1 }}
              className="font-heading text-4xl md:text-6xl text-[#1A1A1A] uppercase tracking-widest leading-[1.1]"
            >
              Signature <br />
              <span className="text-[#967C55] italic font-light lowercase">
                Fragrances
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.2 }}
            className="text-[#5A5A5A] font-light leading-relaxed max-w-md md:text-right"
          >
            Discover our most coveted, timeless creations. Handcrafted with the
            rarest ingredients for an unforgettable aura.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-14"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <NextLevelProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-20 flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative overflow-hidden bg-transparent border border-[#1A1A1A] text-[#1A1A1A] px-10 py-4 text-sm font-medium tracking-[0.2em] uppercase transition-colors hover:text-white"
          >
            <span className="relative z-10">Explore Collection</span>
            <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.65,0,0.35,1]" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
