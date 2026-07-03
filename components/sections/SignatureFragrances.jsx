"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { productsContent } from "../../content/products";

// Snappier cinematic ease
const customEase = [0.65, 0, 0.35, 1];

const NextLevelProductCard = ({ product }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 3D rotation based on mouse coordinates
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
    <div
      style={{ perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative w-full aspect-[3/4] cursor-pointer"
    >
      <div
        className="w-full h-full relative rounded-2xl overflow-hidden bg-[#F9F8F6] shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(150,124,85,0.2)] transition-shadow duration-700"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,transparent_70%)] opacity-60 pointer-events-none" />

        {/* Product Image Section (Dynamically resizes to push image up on hover) */}
        <div 
          className="absolute inset-x-0 top-0 bottom-[24%] group-hover:bottom-[42%] flex items-center justify-center transition-all duration-700 ease-[0.65,0,0.35,1]"
        >
          {/* 3D Tilting applied ONLY to the image here */}
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.5 }}
            className="relative w-[75%] h-[75%] transition-transform duration-700 ease-[0.65,0,0.35,1] group-hover:scale-105"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.1)] group-hover:drop-shadow-[0_30px_40px_rgba(0,0,0,0.2)] transition-all duration-700"
            />
          </motion.div>
        </div>

        {/* Expanding Glass Drawer (Contains Text and Actions) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[24%] group-hover:h-[42%] bg-white/70 backdrop-blur-xl border-t border-white transition-all duration-700 ease-[0.65,0,0.35,1] flex flex-col justify-center px-6"
          style={{ transform: "translateZ(30px)" }}
        >
          {/* Header Info (Always visible) */}
          <div className="flex justify-between items-end w-full">
            <div className="flex flex-col">
              <span className="text-[9px] tracking-[0.3em] text-[#967C55] uppercase font-bold mb-1">
                {product.type}
              </span>
              <h3 className="font-heading text-lg md:text-xl text-[#1A1A1A] truncate max-w-[140px] sm:max-w-[180px]">
                {product.name}
              </h3>
            </div>
            <span className="text-[#5A5A5A] font-light text-sm mb-1">{product.price}</span>
          </div>

          {/* Action Buttons (Reveal on hover) */}
          <div className="h-0 opacity-0 group-hover:h-12 group-hover:opacity-100 group-hover:mt-5 transition-all duration-700 ease-[0.65,0,0.35,1] overflow-hidden flex items-center gap-2">
            
            <button 
              className="flex-1 h-11 bg-[#1A1A1A] hover:bg-[#967C55] text-white text-xs font-medium tracking-widest uppercase rounded-lg transition-colors duration-300 flex items-center justify-center"
              aria-label="Add to Cart"
            >
              Add to Cart
            </button>
            
            <button 
              className="w-11 h-11 flex-shrink-0 bg-white border border-[#1A1A1A]/10 hover:border-[#967C55] text-[#1A1A1A] hover:text-[#967C55] rounded-lg flex items-center justify-center transition-colors duration-300 shadow-sm"
              aria-label="Quick View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            
            <button 
              className="w-11 h-11 flex-shrink-0 bg-white border border-[#1A1A1A]/10 hover:border-[#967C55] text-[#1A1A1A] hover:text-[#967C55] rounded-lg flex items-center justify-center transition-colors duration-300 shadow-sm"
              aria-label="Add to Wishlist"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default function SignatureFragrances() {
  const products = productsContent.signature.map((product, index) => ({
    ...product,
    image: `/imgs/products/${index + 1}.png`
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: customEase } }
  };

  return (
    <section className="relative min-h-screen bg-[#FDFCF8] py-24 md:py-32 overflow-hidden">
      {/* Decorative subtle background element */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#F2EFE8] to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
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
              <span className="text-[#967C55] italic font-light lowercase">Fragrances</span>
            </motion.h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.2 }}
            className="text-[#5A5A5A] font-light leading-relaxed max-w-md md:text-right"
          >
            Discover our most coveted, timeless creations. Handcrafted with the rarest ingredients for an unforgettable aura.
          </motion.p>
        </div>

        {/* Premium Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <NextLevelProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
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
