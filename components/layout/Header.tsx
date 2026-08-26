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
import ProductSearchDialog from "./ProductSearchDialog";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

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
      const { activeSubHref, isActive } = activeNavigationState(link, pathname);
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
            className={`absolute left-1/2 top-1/2 size-1 -translate-x-1/2 translate-y-3.75 rotate-45 transition-all duration-500 ${
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
            className={`grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-2 transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:gap-4 sm:px-6 sm:py-3 lg:px-8 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-stretch xl:gap-0 ${
              isScrolled
                ? "border-b border-[#1A1A1A]/5 bg-white/95 shadow-sm backdrop-blur-2xl"
                : forceDarkText
                  ? "border-b border-[#1A1A1A]/6 bg-[#f3eee5]/95 shadow-sm backdrop-blur-2xl"
                  : "border-b border-transparent bg-transparent"
            }`}
          >
            <div className="hidden min-w-0 items-stretch justify-end xl:flex">
              <nav className="hidden self-stretch items-center gap-x-6 pr-6 2xl:gap-x-10 2xl:pr-10 xl:flex">
                {renderNavLinks(leftLinks, 0, forceDarkText)}
              </nav>
            </div>

            <Link
              href="/"
              aria-label={`${globalContent.header.name} home`}
              className="relative z-30 block w-16 shrink-0 self-center xl:mx-7 xl:w-20"
            >
              <Image
                src={globalContent.header.logo}
                alt={globalContent.header.name}
                width={291}
                height={373}
                priority
                sizes="(max-width: 1279px) 64px, 80px"
                className={`h-auto w-16 object-contain transition-[filter] duration-500 xl:w-20 ${
                  isScrolled || forceDarkText ? "invert-100" : ""
                }`}
              />
            </Link>

            <div className="flex min-w-0 items-stretch justify-end xl:justify-start">
              <nav className="hidden self-stretch items-center gap-x-6 pl-6 pr-3 2xl:gap-x-10 2xl:pl-10 2xl:pr-6 xl:flex">
                {renderNavLinks(rightLinks, 3, forceDarkText)}
              </nav>

              <div
                className={`hidden items-center gap-1 transition-colors duration-500 2xl:gap-2 xl:flex ${isScrolled || forceDarkText ? "text-[#1A1A1A]" : "text-dark-100"}`}
              >
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
                  aria-label="Search"
                  aria-controls="product-search-dialog"
                  aria-expanded={isSearchOpen}
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative group/icon overflow-hidden transition-colors duration-500 ${isScrolled || forceDarkText ? "hover:bg-black/5" : "hover:bg-white/10"}`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  type="button"
                >
                  <Search
                    size={20}
                    strokeWidth={1.5}
                    className={`relative z-10 transition-all duration-500 ease-out group-hover/icon:scale-110 ${isScrolled || forceDarkText ? "group-hover/icon:text-[#967C55]" : "group-hover/icon:text-primary-400"}`}
                  />
                </button>
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

              <div className="ml-auto flex items-center gap-0.5 sm:gap-1 xl:hidden">
                <button
                  aria-label="Search"
                  aria-controls="product-search-dialog"
                  aria-expanded={isSearchOpen}
                  className={`relative grid size-11 place-items-center rounded-full transition-colors ${isScrolled || forceDarkText ? "text-[#1A1A1A] hover:bg-black/5" : "text-dark-100 hover:bg-white/10"}`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  type="button"
                >
                  <Search aria-hidden="true" size={20} strokeWidth={1.5} />
                </button>
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
                  onClick={() => {
                    setIsSearchOpen(false);
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  }}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-controls="mobile-navigation-sidebar"
                  aria-expanded={isMobileMenuOpen}
                  type="button"
                  className={`grid size-11 place-items-center rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 ${
                    isScrolled || forceDarkText
                      ? "text-[#1A1A1A] hover:bg-black/5"
                      : "text-dark-100 hover:bg-primary-500/10"
                  }`}
                >
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div id="product-search-dialog">
        <ProductSearchDialog
          onClose={() => setIsSearchOpen(false)}
          open={isSearchOpen}
        />
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.button
              key="mobile-navigation-backdrop"
              type="button"
              aria-label="Close navigation menu"
              data-header-nav="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-60 cursor-default bg-black/60 backdrop-blur-[2px] xl:hidden"
            />

            <motion.aside
              key="mobile-navigation-sidebar"
              id="mobile-navigation-sidebar"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-navigation-title"
              data-header-nav="true"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: 0.38,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="fixed inset-y-0 right-0 z-70 flex h-dvh w-[min(86vw,24rem)] flex-col overflow-hidden border-l border-[#1A1A1A]/10 bg-[#f7f2e9]/98 shadow-[-24px_0_70px_rgba(0,0,0,0.25)] xl:hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#1A1A1A]/10 bg-white/30 px-5 py-3 sm:px-6 sm:py-4">
                <Link
                  href="/"
                  aria-label={`${globalContent.header.name} home`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-12"
                >
                  <Image
                    src={globalContent.header.logo}
                    alt={globalContent.header.name}
                    width={291}
                    height={373}
                    sizes="48px"
                    className="h-auto w-12 object-contain invert-100"
                  />
                </Link>
                <h2 id="mobile-navigation-title" className="sr-only">
                  Navigation menu
                </h2>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="grid size-11 place-items-center rounded-full border border-[#1A1A1A]/10 text-[#1A1A1A] transition-colors hover:border-primary-500/40 hover:bg-black/5 hover:text-[#7a5825] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  <X aria-hidden="true" size={22} strokeWidth={1.6} />
                </button>
              </div>

              <nav
                aria-label="Mobile navigation"
                className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-6 sm:space-y-6 sm:px-6 sm:py-8"
              >
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
                        className={`relative flex items-center justify-between overflow-hidden border px-3 py-3 font-heading text-lg uppercase tracking-widest transition-all duration-300 sm:px-4 sm:text-xl ${
                          isActive
                            ? "border-primary-500/30 bg-[linear-gradient(90deg,rgba(184,123,56,0.18),rgba(184,123,56,0.03))] text-[#7a5825] shadow-[inset_3px_0_0_#b87b38]"
                            : "border-x-transparent border-t-transparent border-b-[#1A1A1A]/8 text-[#1A1A1A] group-hover/mobnav:text-[#7a5825]"
                        }`}
                      >
                        {link.label}
                        {isActive ? (
                          <span className="flex items-center gap-2 font-body text-[8px] font-semibold tracking-[0.22em] text-[#7a5825]/75">
                            <span className="size-1 rotate-45 bg-primary-500" />
                            Current
                          </span>
                        ) : null}
                      </Link>
                      {link.items && (
                        <div className="space-y-3 py-3 pl-3 sm:space-y-4 sm:py-4 sm:pl-4">
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
                                  ? "border-primary-500 text-[#7a5825]"
                                  : "border-[#1A1A1A]/12 text-[#1A1A1A]/60 hover:border-primary-500/45 hover:text-[#7a5825]"
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
              </nav>

              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#1A1A1A]/10 bg-white/40 px-5 py-4 sm:px-6">
                <Link
                  href="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full border border-[#1A1A1A]/10 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A] transition-colors hover:border-primary-500/40 hover:bg-white/60 hover:text-[#7a5825]"
                >
                  <Heart aria-hidden="true" size={16} strokeWidth={1.6} />
                  Wishlist
                </Link>
                <button
                  type="button"
                  aria-label={`Open cart with ${cartCount} items`}
                  aria-controls="cart-sidebar"
                  aria-expanded={isCartOpen}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCart();
                  }}
                  className="relative flex items-center justify-center gap-2 rounded-full border border-[#1A1A1A]/10 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A] transition-colors hover:border-primary-500/40 hover:bg-white/60 hover:text-[#7a5825]"
                >
                  <ShoppingCart
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.6}
                  />
                  Cart
                  {cartCount ? (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-dark-950">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
