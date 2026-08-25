"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Variants } from "motion/react";
import Link from "next/link";
import type { MouseEventHandler } from "react";
import type { DropdownNavigationItem } from "../../content/global";

interface SimpleDropdownProps {
  item: DropdownNavigationItem;
  isActive: boolean;
  activeSubHref?: string;
  isOpen: boolean;
  isScrolled: boolean;
  forceDarkText: boolean;
  onMouseEnter: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
}

export default function SimpleDropdown({
  item,
  isActive,
  activeSubHref,
  isOpen,
  isScrolled,
  forceDarkText,
  onMouseEnter,
  onMouseLeave,
}: SimpleDropdownProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.05 },
    },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <div
      className="group/droplink relative isolate flex h-full cursor-pointer items-center"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span
        aria-hidden="true"
        className={`absolute -inset-x-3 top-1/2 -z-10 h-9 -translate-y-1/2 rounded-full border backdrop-blur-md transition-all duration-500 ${
          isActive
            ? forceDarkText || isScrolled
              ? "scale-100 border-[#967C55]/25 bg-[#967C55]/9 opacity-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_24px_rgba(112,80,40,0.09)]"
              : "scale-100 border-primary-300/25 bg-black/14 opacity-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.12)]"
            : "scale-95 border-transparent bg-transparent opacity-0"
        }`}
      />
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={`relative z-10 flex h-full items-center text-[12px] font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
          isActive
            ? forceDarkText || isScrolled
              ? "text-[#7a5825]"
              : "text-primary-200"
            : forceDarkText || isScrolled
              ? "text-[#1A1A1A] group-hover/droplink:text-[#967C55]"
              : "text-dark-100 group-hover/droplink:text-primary-300"
        }`}
      >
        {item.label}
      </Link>

      <span
        aria-hidden="true"
        className={`absolute bottom-3 left-0 h-px w-full transition-transform duration-500 ease-out group-hover/droplink:origin-left ${isOpen || isActive ? "origin-left scale-x-100" : "origin-right scale-x-0"} ${
          forceDarkText || isScrolled ? "bg-[#967C55]" : "bg-primary-400"
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute bottom-2.5 left-1/2 size-1 -translate-x-1/2 rotate-45 transition-all duration-500 ${
          isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
        } ${forceDarkText || isScrolled ? "bg-[#967C55]" : "bg-primary-300"}`}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(2px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-0 min-w-60 bg-[#FDFCF8] border border-[#1A1A1A]/5 py-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] cursor-default z-100"
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
                    aria-current={activeSubHref === subItem.href ? "page" : undefined}
                    className={`relative block border-l-2 px-8 py-3 text-[12px] uppercase tracking-[0.15em] transition-colors ${
                      activeSubHref === subItem.href
                        ? "border-[#967C55] bg-[#967C55]/8 text-[#7a5825]"
                        : "border-transparent text-[#5A5A5A] hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]"
                    }`}
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
