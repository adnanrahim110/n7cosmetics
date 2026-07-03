"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaHeart, FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";
import { globalContent } from "../../content/global";
import MegaMenu from "./MegaMenu";
import SimpleDropdown from "./SimpleDropdown";

gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const headerContainerRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          if (window.scrollY <= 10) {
            gsap.to(headerContainerRef.current, {
              y: 0,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
            });
          } else if (self.direction === 1) {
            gsap.to(headerContainerRef.current, {
              y: -120,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
            });
            setIsMobileMenuOpen(false);
          } else if (self.direction === -1) {
            gsap.to(headerContainerRef.current, {
              y: 0,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
            });
          }
        },
      });
    }, headerContainerRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <header
        ref={headerContainerRef}
        className="fixed top-0 left-0 w-full z-50 flex flex-col will-change-transform"
        style={{ transform: "translateY(0)" }}
      >
        <div className="h-10 bg-primary-950 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          <span className="text-primary-200 text-[10px] md:text-xs tracking-[0.2em] uppercase font-light">
            {globalContent.header.topbarText}
          </span>
        </div>

        <div className="h-20 bg-dark-950/60 backdrop-blur-2xl border-b border-white/5 transition-all duration-700 hover:bg-dark-950/90 group">
          <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-12 h-full">
            <div className="flex justify-between items-center h-full">
              <div className="shrink-0 flex items-center">
                <Link
                  href="/"
                  className="relative -top-5 font-heading text-2xl md:text-3xl tracking-[0.15em] text-primary-100 uppercase transition-colors duration-500 group-hover:text-primary-300"
                >
                  <Image
                    src={globalContent.header.logo}
                    alt={globalContent.header.name}
                    width={400}
                    height={400}
                    className="w-20 h-auto"
                  />
                </Link>
              </div>

              <nav className="hidden xl:flex space-x-10 h-full items-center">
                {globalContent.header.navigation.map((link, idx) => {
                  if (link.type === "mega") {
                    return (
                      <MegaMenu
                        key={idx}
                        item={link}
                        isOpen={hoveredNav === idx}
                        onMouseEnter={() => setHoveredNav(idx)}
                        onMouseLeave={() => setHoveredNav(null)}
                      />
                    );
                  }
                  if (link.type === "dropdown") {
                    return (
                      <SimpleDropdown
                        key={idx}
                        item={link}
                        isOpen={hoveredNav === idx}
                        onMouseEnter={() => setHoveredNav(idx)}
                        onMouseLeave={() => setHoveredNav(null)}
                      />
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className="h-full flex items-center relative group/navlink cursor-pointer"
                      onMouseEnter={() => setHoveredNav(null)}
                    >
                      <Link
                        href={link.href}
                        className="text-dark-100 group-hover/navlink:text-primary-300 transition-colors duration-300 text-[12px] tracking-[0.15em] uppercase font-medium"
                      >
                        {link.label}
                      </Link>
                      <span className="absolute bottom-7 left-0 w-full h-px bg-primary-400 origin-right group-hover/navlink:origin-left scale-x-0 group-hover/navlink:scale-x-100 transition-transform duration-500 ease-out" />
                    </div>
                  );
                })}
              </nav>

              <div className="hidden xl:flex items-center space-x-2 text-dark-100">
                <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-300">
                  <FaSearch size={18} />
                </button>
                <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-300">
                  <FaUser size={18} />
                </button>
                <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-300">
                  <FaHeart size={18} />
                </button>
                <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-300 relative group/cart">
                  <FaShoppingCart size={18} />
                  <span className="absolute top-2 right-2 bg-primary-500 text-dark-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-dark-950 transition-transform duration-300 group-hover/cart:scale-110">
                    0
                  </span>
                </button>
              </div>

              <div className="flex xl:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-dark-100 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-300 focus:outline-none"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            data-header-nav="true"
            initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="xl:hidden fixed top-307 left-0 w-full h-[calc(100vh-120px)] overflow-y-auto bg-dark-950/95 backdrop-blur-3xl border-t border-white/5 z-40 pb-20"
          >
            <div className="px-8 py-10 space-y-8">
              {globalContent.header.navigation.map((link, idx) => (
                <div key={idx} className="group/mobnav">
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2 text-xl font-heading text-dark-50 group-hover/mobnav:text-primary-300 uppercase tracking-widest border-b border-white/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                  {link.items && (
                    <div className="pl-4 py-4 space-y-4">
                      {link.items.map((sub, sIdx) => (
                        <Link
                          key={sIdx}
                          href={sub.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-[12px] text-dark-300 hover:text-primary-300 uppercase tracking-[0.15em] transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}
