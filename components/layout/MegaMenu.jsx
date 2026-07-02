"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

export default function MegaMenu({ item, isOpen, onMouseEnter, onMouseLeave }) {
  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div 
      className="relative h-full flex items-center group/megalink cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link 
        href={item.href}
        className="text-dark-100 group-hover/megalink:text-primary-300 transition-colors duration-300 text-[12px] tracking-[0.15em] uppercase font-medium h-full flex items-center"
      >
        {item.label}
      </Link>
      {/* Animated Sweeping Underline */}
      <span className={`absolute bottom-[28px] left-0 w-full h-[1px] bg-primary-400 origin-right group-hover/megalink:origin-left transition-transform duration-500 ease-out ${isOpen ? 'scale-x-100' : 'scale-x-0'}`} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            // Added mt-2 to separate from header, lighter bg-dark-900, stronger border, and massive shadow to fix darkness/blending
            className="absolute top-[80px] left-1/2 -translate-x-1/2 mt-4 w-[900px] bg-dark-900/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] cursor-default rounded-lg overflow-hidden z-[100]"
          >
            <div className="flex w-full min-h-[320px]">
              
              {/* Editorial Left Side */}
              <div className="w-2/5 relative bg-dark-950 overflow-hidden group">
                <Image 
                  src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop"
                  alt="Featured Collection"
                  fill
                  className="object-cover opacity-50 group-hover:opacity-70 transition-all duration-[2s] group-hover:scale-110 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/40 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <span className="text-primary-400 text-[10px] tracking-[0.2em] uppercase mb-2">Featured</span>
                  <h3 className="font-heading text-2xl text-white leading-snug">
                    {item.label}
                  </h3>
                </div>
              </div>

              {/* Products Grid Right Side - Refined to 2x2 Horizontal Layout */}
              <div className="w-3/5 p-10 flex items-center bg-dark-900/50">
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="grid grid-cols-2 gap-x-8 gap-y-8 w-full"
                >
                  {item.items.map((subItem, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="w-full">
                      {subItem.image ? (
                        <Link href={subItem.href} className="flex items-center space-x-5 group p-2 -m-2 rounded-md hover:bg-white/5 transition-colors duration-300">
                          <div className="relative w-20 h-24 shrink-0 overflow-hidden rounded-sm border border-white/5 group-hover:border-primary-500/30 transition-colors duration-300">
                            <Image 
                              src={subItem.image} 
                              alt={subItem.name}
                              fill
                              className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-heading text-[15px] text-white group-hover:text-primary-300 transition-colors duration-300">
                              {subItem.name}
                            </span>
                            <span className="text-[10px] text-dark-300 uppercase tracking-widest mt-2 flex items-center group-hover:text-primary-400 transition-colors duration-300">
                              Explore
                              <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <Link href={subItem.href} className="flex items-center space-x-5 group p-2 -m-2 rounded-md hover:bg-white/5 transition-colors duration-300 h-full">
                          <div className="relative w-20 h-24 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-dark-950 flex items-center justify-center group-hover:border-primary-500/30 transition-colors duration-300">
                             <span className="text-primary-400 opacity-50 group-hover:opacity-100 transition-opacity">
                               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                               </svg>
                             </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-heading text-[15px] text-white group-hover:text-primary-300 transition-colors duration-300">
                              View All
                            </span>
                            <span className="text-[10px] text-dark-300 uppercase tracking-widest mt-2 group-hover:text-primary-400 transition-colors duration-300">
                              Full Collection
                            </span>
                          </div>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
