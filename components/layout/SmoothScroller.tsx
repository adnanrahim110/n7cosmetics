"use client";

import { useEffect, type ReactNode } from "react";
import type Lenis from "lenis";
import { scheduleAfterLoad } from "@/lib/browser/schedule-after-load";

export default function SmoothScroller({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    const preference = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let instance: Lenis | undefined;
    let disposed = false;
    let revision = 0;
    const update = async () => {
      const currentRevision = ++revision;
      instance?.destroy();
      instance = undefined;
      if (!preference.matches) return;
      const { default: LenisConstructor } = await import("lenis");
      if (disposed || currentRevision !== revision || !preference.matches) return;
      instance = new LenisConstructor({
        allowNestedScroll: true,
        anchors: true,
        autoRaf: true,
        autoResize: true,
        lerp: 0.12,
        overscroll: true,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
        syncTouch: false,
      });
    };
    const changed = () => { void update(); };
    const cancel = scheduleAfterLoad(changed);
    preference.addEventListener("change", changed);
    return () => { disposed = true; cancel(); preference.removeEventListener("change", changed); instance?.destroy(); };
  }, []);

  return children;
}
