"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "../../content/global";
import { globalContent } from "../../content/global";
import type { HeaderContent } from "@/lib/homepage/types";
import { useCommerce } from "../commerce/CommerceProvider";
import MegaMenu from "./MegaMenu";
import SimpleDropdown from "./SimpleDropdown";

gsap.registerPlugin(ScrollTrigger);

interface AnnouncementMarqueeProps {
  text: string;
  Icon: LucideIcon;
  reverse?: boolean;
}

function AnnouncementMarquee({
  text,
  Icon,
  reverse = false,
}: AnnouncementMarqueeProps) {
  return (
    <div
      className="announcement-marquee h-full min-w-0"
      role="note"
      aria-label={text}
    >
      <div
        className={`announcement-marquee-track h-full ${reverse ? "announcement-marquee-track-reverse" : ""}`}
        aria-hidden="true"
      >
        {[0, 1].map((group) => (
          <div key={group} className="announcement-marquee-group h-full">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className="inline-flex shrink-0 items-center gap-2.5 px-5 text-[9px] font-semibold uppercase tracking-[0.19em] text-white sm:px-7 sm:text-[12px] lg:px-9"
              >
                <Icon
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.7}
                  className="shrink-0 text-white drop-shadow-[0_0_7px_rgba(216,170,97,0.7)]"
                />
                {text}
                <Sparkles
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.6}
                  className="shrink-0 text-white"
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Header({
  content,
}: {
  content: HeaderContent;
}) {
  const { cartCount, wishlistCount } = useCommerce();
  const headerContainerRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<number | null>(null);
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
              yPercent: 0,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
            });
          } else if (self.direction === 1) {
            gsap.to(headerContainerRef.current, {
              yPercent: -100,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
            });
            setIsMobileMenuOpen(false);
          } else if (self.direction === -1) {
            gsap.to(headerContainerRef.current, {
              yPercent: 0,
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

  const leftLinks = content.navigation.slice(0, 3);
  const rightLinks = content.navigation.slice(3);

  const renderNavLinks = (
    links: NavigationItem[],
    startIndex: number,
    forceDarkText: boolean,
  ) => {
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
            className={`absolute bottom-3 left-0 w-full h-0.5 origin-right group-hover/navlink:origin-left scale-x-0 group-hover/navlink:scale-x-100 transition-transform duration-500 ease-out ${
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
            ? "bg-white backdrop-blur-2xl shadow-sm border-b border-[#1A1A1A]/5"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{ transform: "translateY(0)" }}
      >
        <div className="relative">
          <div className="relative overflow-hidden border-b border-primary-500 bg-primary-500 h-12">
            <div className="relative grid h-full grid-cols-[minmax(0,1fr)_104px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_128px_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_176px_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_224px_minmax(0,1fr)]">
              <AnnouncementMarquee
                text={content.topbarText}
                Icon={Truck}
              />

              <div aria-hidden="true" />

              <AnnouncementMarquee
                text={content.topbarRightText}
                Icon={BadgeCheck}
                reverse
              />
            </div>
          </div>

          <div className="flex w-full items-stretch h-12">
            <div className="flex flex-1 items-center justify-end transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <nav className="hidden h-full items-center gap-x-10 px-12 xl:flex">
                {renderNavLinks(leftLinks, 0, false)}
              </nav>
            </div>

            <div className="w-26 shrink-0 sm:w-32 lg:w-44 xl:w-56" />

            <div className="flex flex-1 items-center justify-start transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <nav className="hidden h-full items-center gap-x-10 pl-12 pr-8 xl:flex">
                {renderNavLinks(rightLinks, 3, false)}
              </nav>

              <div
                className={`hidden items-center space-x-3 pr-12 transition-colors duration-700 xl:flex ${isScrolled ? "text-[#1A1A1A]" : "text-dark-100"}`}
              >
                <button
                  aria-label="Search"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled ? "hover:bg-[#F5F3ED]" : "hover:bg-white/10"}`}
                  type="button"
                >
                  <Search
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                </button>
                <Link
                  aria-label="Admin sign in"
                  href="/admin"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled ? "hover:bg-[#F5F3ED]" : "hover:bg-white/10"}`}
                >
                  <User
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                </Link>
                <Link
                  aria-label={`Wishlist with ${wishlistCount} items`}
                  href="/wishlist"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled ? "hover:bg-[#F5F3ED]" : "hover:bg-white/10"}`}
                >
                  <Heart
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                  {wishlistCount ? (
                    <span className="absolute top-1 right-1 z-20 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-dark-950">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  aria-label={`Cart with ${cartCount} items`}
                  href="/cart"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/cart overflow-hidden transition-colors duration-500 ${isScrolled ? "hover:bg-[#F5F3ED]" : "hover:bg-white/10"}`}
                >
                  <ShoppingCart
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/cart:scale-110 ${isScrolled ? "group-hover/cart:text-[#967C55]" : "group-hover/cart:text-primary-400"}`}
                  />
                  <span className="absolute top-1 right-1 z-20 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-dark-950 transition-all duration-500 group-hover/cart:scale-110">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                </Link>
              </div>

              <div className="ml-auto flex items-center pr-4 xl:hidden sm:pr-6">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
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

          <Link
            href="/"
            aria-label={`${globalContent.header.name} home`}
            className="group absolute -inset-y-px left-1/2 z-30 w-26 -translate-x-1/2 overflow-hidden sm:w-20"
          >
            <span className="pointer-events-none absolute inset-0 bg-white" />
            <span className="absolute inset-1.5">
              <Image
                src={globalContent.header.logo}
                alt={globalContent.header.name}
                fill
                priority
                sizes="(min-width: 1280px) 224px, (min-width: 1024px) 176px, (min-width: 640px) 128px, 104px"
                className="object-contain invert-100"
              />
            </span>
          </Link>
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
            className="fixed left-0 top-32 z-40 h-[calc(100vh-128px)] w-full overflow-y-auto border-t border-white/5 bg-dark-950/95 pb-20 backdrop-blur-3xl md:top-36 md:h-[calc(100vh-144px)] xl:hidden"
          >
            <div className="px-8 py-10 space-y-8">
              {content.navigation.map((link, idx) => (
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

    </>
  );
}
