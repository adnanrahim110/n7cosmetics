import { AnimatePresence, motion } from "motion/react";
import type { Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MouseEventHandler } from "react";
import type { MegaNavigationItem } from "../../content/global";

interface MegaMenuProps {
  item: MegaNavigationItem;
  isActive: boolean;
  activeSubHref?: string;
  isOpen: boolean;
  isScrolled: boolean;
  forceDarkText: boolean;
  topOffset: number;
  onMouseEnter: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
}

export default function MegaMenu({
  item,
  isActive,
  activeSubHref,
  isOpen,
  isScrolled,
  forceDarkText,
  topOffset,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuProps) {
  const linkRef = useRef<HTMLDivElement>(null);
  const [leftPx, setLeftPx] = useState(0);

  useEffect(() => {
    if (isOpen && linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      const menuWidth = 900;
      const centerOfLink = rect.left + rect.width / 2;

      let idealLeft = centerOfLink - menuWidth / 2;
      const padding = 32;

      if (idealLeft < padding) {
        idealLeft = padding;
      } else if (idealLeft + menuWidth > window.innerWidth - padding) {
        idealLeft = window.innerWidth - menuWidth - padding;
      }

      setLeftPx(idealLeft);
    }
  }, [isOpen]);

  // Stagger animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div
      ref={linkRef}
      className="group/megalink relative isolate flex h-full cursor-pointer items-center"
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
              ? "text-[#1A1A1A] group-hover/megalink:text-[#967C55]"
              : "text-dark-100 group-hover/megalink:text-primary-300"
        }`}
      >
        {item.label}
      </Link>
      <span
        aria-hidden="true"
        className={`absolute bottom-3 left-0 h-px w-full transition-transform duration-500 ease-out group-hover/megalink:origin-left ${isOpen || isActive ? "origin-left scale-x-100" : "origin-right scale-x-0"} ${
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
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              left: leftPx || "50%",
              top: topOffset,
              x: leftPx ? 0 : "-50%",
            }}
            className="fixed w-full max-w-225 bg-[#FDFCF8] border border-[#1A1A1A]/5 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] cursor-default overflow-hidden z-100"
          >
            <div className="flex w-full min-h-90">
              <div className="w-2/5 relative overflow-hidden group bg-[#F5F3ED]">
                <Image
                  src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop"
                  alt="Featured Collection"
                  fill
                  className="object-cover opacity-90 group-hover:opacity-100 transition-all duration-[2s] group-hover:scale-105 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                  <span className="text-[#F2EFE8] font-medium text-[10px] tracking-[0.2em] uppercase mb-3 block">
                    Featured
                  </span>
                  <h3 className="font-heading text-3xl text-white leading-snug drop-shadow-md">
                    {item.label}
                  </h3>
                </div>
              </div>

              <div className="w-3/5 p-12 flex items-center bg-[#FDFCF8]">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="grid grid-cols-2 gap-x-6 gap-y-6 w-full"
                >
                  {item.items.map((subItem, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      className="w-full"
                    >
                      {subItem.image ? (
                        <Link
                          href={subItem.href}
                          aria-current={activeSubHref === subItem.href ? "page" : undefined}
                          className={`group flex items-center space-x-5 rounded-xl border p-4 transition-all duration-500 hover:bg-black/3 hover:shadow-sm ${
                            activeSubHref === subItem.href
                              ? "border-[#967C55]/25 bg-[#967C55]/8 shadow-sm"
                              : "border-transparent"
                          }`}
                        >
                          <div className="relative w-20 h-24 shrink-0 overflow-hidden bg-[#F5F3ED] group-hover:bg-white group-hover:shadow-inner border border-transparent transition-colors duration-500">
                            <Image
                              src={subItem.image}
                              alt={subItem.name}
                              fill
                              className="object-contain p-2 mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-heading text-[15px] text-[#1A1A1A] group-hover:text-[#967C55] transition-colors duration-300">
                              {subItem.name}
                            </span>
                            <span className="text-[10px] text-[#5A5A5A] uppercase tracking-widest mt-2 flex items-center group-hover:text-[#967C55] transition-colors duration-300">
                              Explore
                              <svg
                                className="w-3 h-3 ml-2 transform group-hover:translate-x-2 transition-transform duration-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </svg>
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <Link
                          href={subItem.href}
                          aria-current={activeSubHref === subItem.href ? "page" : undefined}
                          className={`group flex h-full items-center space-x-5 rounded-xl border p-4 transition-all duration-500 hover:bg-black/3 hover:shadow-sm ${
                            activeSubHref === subItem.href
                              ? "border-[#967C55]/25 bg-[#967C55]/8 shadow-sm"
                              : "border-transparent"
                          }`}
                        >
                          <div className="relative w-20 h-24 shrink-0 overflow-hidden bg-[#F5F3ED] group-hover:bg-white flex items-center justify-center border border-transparent transition-colors duration-500">
                            <span className="text-[#967C55] opacity-60 group-hover:opacity-100 transition-opacity">
                              <svg
                                className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                              </svg>
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-heading text-[15px] text-[#1A1A1A] group-hover:text-[#967C55] transition-colors duration-300">
                              View All
                            </span>
                            <span className="text-[10px] text-[#5A5A5A] uppercase tracking-widest mt-2 group-hover:text-[#967C55] transition-colors duration-300">
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
