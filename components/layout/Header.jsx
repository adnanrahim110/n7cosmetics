"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const leftLinks = globalContent.header.navigation.slice(0, 4);
  const rightLinks = globalContent.header.navigation.slice(4);

  const renderNavLinks = (links, startIndex, forceDarkText) => {
    return links.map((link, idx) => {
      const globalIdx = startIndex + idx;
      if (link.type === "mega") {
        return (
          <MegaMenu
            key={globalIdx}
            item={link}
            isOpen={hoveredNav === globalIdx}
            isScrolled={isScrolled}
            forceDarkText={forceDarkText}
            onMouseEnter={() => setHoveredNav(globalIdx)}
            onMouseLeave={() => setHoveredNav(null)}
          />
        );
      }
      if (link.type === "dropdown") {
        return (
          <SimpleDropdown
            key={globalIdx}
            item={link}
            isOpen={hoveredNav === globalIdx}
            isScrolled={isScrolled}
            forceDarkText={forceDarkText}
            onMouseEnter={() => setHoveredNav(globalIdx)}
            onMouseLeave={() => setHoveredNav(null)}
          />
        );
      }
      return (
        <div
          key={globalIdx}
          className="h-full flex items-center relative group/navlink cursor-pointer"
          onMouseEnter={() => setHoveredNav(null)}
        >
          <Link
            href={link.href}
            className={`transition-colors duration-300 text-[12px] tracking-[0.15em] uppercase font-medium ${
              forceDarkText || isScrolled
                ? "text-[#1A1A1A] group-hover/navlink:text-[#7a5825]"
                : "text-dark-100 group-hover/navlink:text-primary-300"
            }`}
          >
            {link.label}
          </Link>
          <span
            className={`absolute bottom-7 left-0 w-full h-px origin-right group-hover/navlink:origin-left scale-x-0 group-hover/navlink:scale-x-100 transition-transform duration-500 ease-out ${
              forceDarkText || isScrolled ? "bg-[#967C55]" : "bg-primary-400"
            }`}
          />
        </div>
      );
    });
  };

  return (
    <>
      <header
        ref={headerContainerRef}
        className={`fixed top-0 left-0 w-full z-50 will-change-transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "bg-white/95 backdrop-blur-2xl shadow-sm border-b border-[#1A1A1A]/5"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{ transform: "translateY(0)" }}
      >
        <div className="w-full flex items-stretch h-22">
          <div className="flex-1 flex justify-end items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <nav className="hidden xl:flex space-x-5 h-full items-center px-12">
              {renderNavLinks(leftLinks, 0, false)}
            </nav>
          </div>

          <div className="w-56 lg:w-64 shrink-0 flex items-center justify-center relative">
            <Link
              href="/"
              className={`relative font-heading text-2xl md:text-3xl tracking-[0.15em] uppercase transition-transform hover:scale-105 duration-700 block -mt-2`}
            >
              <Image
                src={isScrolled ? "/imgs/logo.png" : globalContent.header.logo}
                alt={globalContent.header.name}
                width={400}
                height={400}
                className="w-20 h-auto relative z-2 top-5 transition-opacity duration-500 drop-shadow-md"
              />
              <div
                className={`transition-all duration-500 ease-in-out ${isScrolled ? "bg-white absolute -inset-x-2 -bottom-4.5 h-8 rounded-b-lg" : "bg-transparent"}`}
              />
            </Link>
          </div>

          <div className="flex-1 flex justify-start items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <nav className="hidden xl:flex space-x-5 h-full items-center pl-12 pr-8">
              {renderNavLinks(rightLinks, 4, false)}
            </nav>

            <div
              className={`hidden xl:flex items-center space-x-3 pr-12 transition-colors duration-700 ${isScrolled ? "text-[#1A1A1A]" : "text-dark-100"}`}
            >
              {[Search, User, Heart].map((Icon, i) => (
                <button
                  key={i}
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled ? "hover:bg-[#F5F3ED]" : "hover:bg-white/10"}`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                </button>
              ))}

              <button
                className={`w-11 h-11 rounded-full flex items-center justify-center relative group/cart overflow-hidden transition-colors duration-500 ${isScrolled ? "hover:bg-[#F5F3ED]" : "hover:bg-white/10"}`}
              >
                <ShoppingCart
                  size={20}
                  strokeWidth={1.5}
                  className={`relative z-10 transition-all duration-500 ease-out group-hover/cart:scale-110 ${isScrolled ? "group-hover/cart:text-[#967C55]" : "group-hover/cart:text-primary-400"}`}
                />
                <span
                  className={`absolute top-1 right-1 text-[9px] font-bold size-4 rounded-full flex items-center justify-center transition-all duration-500 group-hover/cart:scale-110 z-20 bg-primary-500 text-dark-950`}
                >
                  0
                </span>
              </button>
            </div>

            <div className="flex xl:hidden ml-auto pr-6">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                  isScrolled
                    ? "text-[#1A1A1A] hover:bg-black/5"
                    : "text-dark-100 hover:bg-primary-500/10"
                }`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
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
            className="xl:hidden fixed top-24 left-0 w-full h-[calc(100vh-96px)] overflow-y-auto bg-dark-950/95 backdrop-blur-3xl border-t border-white/5 z-40 pb-20"
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
