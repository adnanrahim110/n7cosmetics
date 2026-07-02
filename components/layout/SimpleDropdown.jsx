"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export default function SimpleDropdown({ item, isOpen, onMouseEnter, onMouseLeave }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.05 }
    },
    exit: { opacity: 0, transition: { duration: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  return (
    <div 
      className="relative h-full flex items-center group/droplink cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link 
        href={item.href}
        className="text-dark-100 group-hover/droplink:text-primary-300 transition-colors duration-300 text-[12px] tracking-[0.15em] uppercase font-medium h-full flex items-center"
      >
        {item.label}
      </Link>
      
      {/* Animated Sweeping Underline */}
      <span className={`absolute bottom-[28px] left-0 w-full h-[1px] bg-primary-400 origin-right group-hover/droplink:origin-left transition-transform duration-500 ease-out ${isOpen ? 'scale-x-100' : 'scale-x-0'}`} />

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(2px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-[80px] left-1/2 -translate-x-1/2 mt-0 min-w-[240px] bg-dark-950/95 backdrop-blur-2xl border border-white/5 py-4 shadow-2xl cursor-default rounded-sm"
          >
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col"
            >
              {item.items.map((subItem, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Link 
                    href={subItem.href} 
                    className="block px-8 py-3 text-[12px] text-dark-200 hover:text-primary-300 hover:bg-white/5 transition-colors uppercase tracking-[0.15em]"
                  >
                    {subItem.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
