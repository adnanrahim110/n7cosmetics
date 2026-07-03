"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    let isInitialized = false;
    
    // GSAP quickTo is highly optimized for mouse followers
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });

    const moveCursor = (e) => {
      if (!isInitialized) {
        // Set the cursor immediately on first move to prevent flying in from (0,0)
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        isInitialized = true;
        setIsVisible(true);
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    const handleMouseOver = (e) => {
      // Check if hovering over an interactive element
      const isInteractive = (
        e.target.tagName.toLowerCase() === 'a' || 
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.closest('a') ||
        e.target.closest('button') ||
        e.target.closest('.swiper-slide')
      );
      
      // Exclude Header and Mobile Menu
      const isInsideHeader = e.target.closest('header') || e.target.closest('[data-header-nav]');

      if (isInteractive && !isInsideHeader) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="hidden md:block fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      style={{ willChange: "transform" }}
    >
      {/* Outer Ring */}
      <div 
        className={`absolute top-0 left-0 w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
          !isVisible 
            ? "opacity-0 scale-50" 
            : isHovering 
              ? "opacity-100 scale-[2.5] bg-white border-transparent" 
              : "opacity-60 scale-100 bg-transparent border border-white"
        }`}
      />
      
      {/* Center Dot */}
      <div 
        className={`absolute top-0 left-0 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
          !isVisible || isHovering ? "opacity-0 scale-50" : "opacity-100 scale-100"
        }`}
      />
    </div>
  );
}
