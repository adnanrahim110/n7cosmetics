"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

export default function SmoothScroller({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ReactLenis
      root
      options={{
        allowNestedScroll: true,
        anchors: true,
        autoRaf: true,
        autoResize: true,
        lerp: 0.12,
        overscroll: true,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
