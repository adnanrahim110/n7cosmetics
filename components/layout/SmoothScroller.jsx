"use client";

import { ReactLenis } from "lenis/react";

export default function SmoothScroller({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.05, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
