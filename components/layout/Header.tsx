"use client";

import type { HeaderContent } from "@/lib/homepage/types";
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
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "../../content/global";
import { globalContent } from "../../content/global";
import { useCommerce } from "../commerce/CommerceProvider";
import MegaMenu from "./MegaMenu";
import SimpleDropdown from "./SimpleDropdown";

gsap.registerPlugin(ScrollTrigger);

interface AnnouncementMarqueeProps {
  items: Array<{
    text: string;
    Icon: LucideIcon;
  }>;
}

function pathnameMatchesHref(pathname: string, href: string): boolean {
  if (!href.startsWith("/")) return false;

  const normalizedHref = href.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (normalizedHref === "/") return pathname === "/";

  return (
    pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`)
  );
}

function activeNavigationState(item: NavigationItem, pathname: string) {
  const activeSubHref = item.items?.find((subItem) =>
    pathnameMatchesHref(pathname, subItem.href),
  )?.href;

  return {
    activeSubHref,
    isActive:
      pathnameMatchesHref(pathname, item.href) || Boolean(activeSubHref),
  };
}

function AnnouncementMarquee({ items }: AnnouncementMarqueeProps) {
  const announcements = Array.from({ length: 3 }, () => items).flat();

  return (
    <div
      className="announcement-marquee min-w-0"
      role="note"
      aria-label={items.map((item) => item.text).join(". ")}
    >
      <div className="announcement-marquee-track" aria-hidden="true">
        {[0, 1].map((group) => (
          <div key={group} className="announcement-marquee-group">
            {announcements.map(({ text, Icon }, item) => (
              <span
                key={item}
                className="inline-flex shrink-0 items-center gap-2.5 px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.19em] text-white sm:px-7 sm:text-[12px] lg:px-9"
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

export default function Header({ content }: { content: HeaderContent }) {
  const { cartCount, isCartOpen, openCart, wishlistCount } = useCommerce();
  const pathname = usePathname();
  const forceDarkText = pathname.startsWith("/products/");
  const headerContainerRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const header = headerContainerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(header.getBoundingClientRect().height);
    };
    updateHeaderHeight();

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
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
      const { activeSubHref, isActive } = activeNavigationState(
        link,
        pathname,
      );
      if (link.type === "mega") {
        return (
          <MegaMenu
            key={globalIdx}
            item={link}
            isActive={isActive}
            activeSubHref={activeSubHref}
            isOpen={hoveredNav === globalIdx}
            isScrolled={isScrolled}
            forceDarkText={forceDarkText}
            topOffset={headerHeight}
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
            isActive={isActive}
            activeSubHref={activeSubHref}
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
          className="group/navlink relative isolate flex h-full cursor-pointer items-center"
          onMouseEnter={() => setHoveredNav(null)}
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
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative z-10 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
              isActive
                ? forceDarkText || isScrolled
                  ? "text-[#7a5825]"
                  : "text-primary-200"
                : forceDarkText || isScrolled
                  ? "text-[#1A1A1A] group-hover/navlink:text-[#7a5825]"
                  : "text-dark-100 group-hover/navlink:text-primary-300"
            }`}
          >
            {link.label}
          </Link>
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 h-px w-full translate-y-4 transition-transform duration-500 ease-out group-hover/navlink:origin-left group-hover/navlink:scale-x-100 ${
              isActive ? "origin-left scale-x-100" : "origin-right scale-x-0"
            } ${
              forceDarkText || isScrolled ? "bg-[#967C55]" : "bg-primary-400"
            }`}
          />
          <span
            aria-hidden="true"
            className={`absolute left-1/2 top-1/2 size-1 -translate-x-1/2 translate-y-[15px] rotate-45 transition-all duration-500 ${
              isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
            } ${forceDarkText || isScrolled ? "bg-[#967C55]" : "bg-primary-300"}`}
          />
        </div>
      );
    });
  };

  return (
    <>
      <header
        ref={headerContainerRef}
        className="fixed left-0 top-0 z-50 w-full will-change-transform"
        style={{ transform: "translateY(0)" }}
      >
        <div className="relative">
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isScrolled
                ? "grid-rows-[0fr] opacity-0"
                : "grid-rows-[1fr] opacity-100"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="relative overflow-hidden border-b border-primary-500 bg-primary-500">
                <AnnouncementMarquee
                  items={[
                    { text: content.topbarText, Icon: Truck },
                    { text: content.topbarRightText, Icon: BadgeCheck },
                  ]}
                />
              </div>
            </div>
          </div>

          <div
            className={`grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch px-4 py-2 transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-6 sm:py-3 lg:px-8 ${
              isScrolled
                ? "border-b border-[#1A1A1A]/5 bg-white/95 shadow-sm backdrop-blur-2xl"
                : forceDarkText
                  ? "border-b border-[#1A1A1A]/6 bg-[#f3eee5]/95 shadow-sm backdrop-blur-2xl"
                  : "border-b border-transparent bg-transparent"
            }`}
          >
            <div className="flex min-w-0 items-stretch justify-end">
              <nav className="hidden self-stretch items-center gap-x-6 pr-6 2xl:gap-x-10 2xl:pr-10 xl:flex">
                {renderNavLinks(leftLinks, 0, forceDarkText)}
              </nav>
            </div>

            <Link
              href="/"
              aria-label={`${globalContent.header.name} home`}
              className="relative z-30 mx-3 block w-20 shrink-0 self-center sm:mx-5 lg:mx-7"
            >
              <Image
                src={globalContent.header.logo}
                alt={globalContent.header.name}
                width={291}
                height={373}
                priority
                sizes="80px"
                className={`h-auto w-20 object-contain transition-[filter] duration-500 ${
                  isScrolled || forceDarkText ? "invert-100" : ""
                }`}
              />
            </Link>

            <div className="flex min-w-0 items-stretch justify-start">
              <nav className="hidden self-stretch items-center gap-x-6 pl-6 pr-3 2xl:gap-x-10 2xl:pl-10 2xl:pr-6 xl:flex">
                {renderNavLinks(rightLinks, 3, forceDarkText)}
              </nav>

              <div
                className={`hidden items-center gap-1 transition-colors duration-500 2xl:gap-2 xl:flex ${isScrolled || forceDarkText ? "text-[#1A1A1A]" : "text-dark-100"}`}
              >
                <button
                  aria-label="Search"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled || forceDarkText ? "hover:bg-black/5" : "hover:bg-white/10"}`}
                  type="button"
                >
                  <Search
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled || forceDarkText ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                </button>
                <Link
                  aria-label={`Wishlist with ${wishlistCount} items`}
                  href="/wishlist"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled || forceDarkText ? "hover:bg-black/5" : "hover:bg-white/10"}`}
                >
                  <Heart
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled || forceDarkText ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                  {wishlistCount ? (
                    <span className="absolute top-1 right-1 z-20 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-dark-950">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  ) : null}
                </Link>

                <button
                  aria-label={`Cart with ${cartCount} items`}
                  aria-controls="cart-sidebar"
                  aria-expanded={isCartOpen}
                  onClick={openCart}
                  type="button"
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/cart overflow-hidden transition-colors duration-500 ${isScrolled || forceDarkText ? "hover:bg-black/5" : "hover:bg-white/10"}`}
                >
                  <ShoppingCart
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/cart:scale-110 ${isScrolled || forceDarkText ? "group-hover/cart:text-[#967C55]" : "group-hover/cart:text-primary-400"}`}
                  />
                  <span className="absolute top-1 right-1 z-20 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-dark-950 transition-all duration-500 group-hover/cart:scale-110">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                </button>
              </div>

              <div className="ml-auto flex items-center xl:hidden">
                <button
                  aria-label={`Cart with ${cartCount} items`}
                  aria-controls="cart-sidebar"
                  aria-expanded={isCartOpen}
                  className={`relative grid size-11 place-items-center rounded-full transition-colors ${isScrolled || forceDarkText ? "text-[#1A1A1A] hover:bg-black/5" : "text-dark-100 hover:bg-white/10"}`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCart();
                  }}
                  type="button"
                >
                  <ShoppingCart
                    aria-hidden="true"
                    size={20}
                    strokeWidth={1.5}
                  />
                  {cartCount ? (
                    <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-dark-950">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    isScrolled || forceDarkText
                      ? "text-[#1A1A1A] hover:bg-black/5"
                      : "text-dark-100 hover:bg-primary-500/10"
                  }`}
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
            style={{
              top: headerHeight,
              height: `calc(100dvh - ${headerHeight}px)`,
            }}
            className="fixed inset-x-0 z-40 overflow-y-auto overscroll-contain border-t border-white/5 bg-dark-950/95 pb-20 backdrop-blur-3xl xl:hidden"
          >
            <div className="space-y-6 px-5 py-7 sm:space-y-8 sm:px-8 sm:py-10">
              {content.navigation.map((link, idx) => {
                const { activeSubHref, isActive } = activeNavigationState(
                  link,
                  pathname,
                );

                return (
                  <div key={idx} className="group/mobnav">
                    <Link
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`relative flex items-center justify-between overflow-hidden border px-4 py-3 font-heading text-lg uppercase tracking-widest transition-all duration-300 sm:text-xl ${
                        isActive
                          ? "border-primary-400/30 bg-[linear-gradient(90deg,rgba(184,123,56,0.2),rgba(184,123,56,0.04))] text-primary-200 shadow-[inset_3px_0_0_#b87b38]"
                          : "border-x-transparent border-t-transparent border-b-white/5 text-dark-50 group-hover/mobnav:text-primary-300"
                      }`}
                    >
                      {link.label}
                      {isActive ? (
                        <span className="flex items-center gap-2 font-body text-[8px] font-semibold tracking-[0.22em] text-primary-300/75">
                          <span className="size-1 rotate-45 bg-primary-400" />
                          Current
                        </span>
                      ) : null}
                    </Link>
                    {link.items && (
                      <div className="space-y-3 py-3 pl-4 sm:space-y-4 sm:py-4">
                        {link.items.map((sub, sIdx) => (
                          <Link
                            key={sIdx}
                            href={sub.href}
                            aria-current={
                              activeSubHref === sub.href ? "page" : undefined
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block border-l py-1 pl-4 text-[12px] uppercase tracking-[0.15em] transition-all ${
                              activeSubHref === sub.href
                                ? "border-primary-400 text-primary-200"
                                : "border-white/10 text-dark-300 hover:border-primary-400/45 hover:text-primary-300"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
