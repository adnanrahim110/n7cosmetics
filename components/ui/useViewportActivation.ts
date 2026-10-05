"use client";

import { useEffect, useState, type RefObject } from "react";

/** Keep server-rendered content, but start optional media just before it is visible. */
export function useViewportActivation(ref: RefObject<Element | null>, margin = "600px") {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setActive(true);
      observer.disconnect();
    }, { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin]);

  return active;
}
