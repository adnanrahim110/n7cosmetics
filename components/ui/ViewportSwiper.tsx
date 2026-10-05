"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import type { SwiperModule, SwiperOptions } from "swiper/types";
import { cn } from "@/lib/cn";

interface ViewportSwiperProps {
  children: ReactNode;
  className?: string;
  label?: string;
  options: SwiperOptions;
  loadModules: () => Promise<SwiperModule[]>;
}

/** Server-render slides, then initialise the same Swiper engine near the viewport. */
export default function ViewportSwiper({ children, className, label, options, loadModules }: ViewportSwiperProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let loading = false;
    let swiper: SwiperInstance | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loading) return;
      loading = true;
      observer.disconnect();
      void Promise.all([import("swiper"), loadModules()]).then(([{ default: Swiper }, modules]) => {
        if (!disposed) swiper = new Swiper(element, { ...options, modules });
      }).catch(() => {
        // Native horizontal scrolling remains available if the optional chunk fails.
        if (!disposed) { element.classList.add("overflow-x-auto"); element.classList.remove("overflow-visible!"); }
      });
    }, { rootMargin: "1200px" });
    observer.observe(element);
    return () => { disposed = true; observer.disconnect(); swiper?.destroy(true, true); };
  }, [options, loadModules]);

  return <div ref={container} aria-label={label} className={cn("swiper", className)}><div className="swiper-wrapper">{children}</div></div>;
}
