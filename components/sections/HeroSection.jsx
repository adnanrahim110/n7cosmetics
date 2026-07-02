"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { homeContent } from "../../content/home";
import Button from "../ui/Button";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const containerRef = useRef(null);
  const bgRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Parallax background
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
      });

      // Text Reveal Animation
      gsap.fromTo(
        textRef.current.children,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Parallax Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-[120%] -top-[10%] bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-dark-950/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <div ref={textRef}>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-primary-100 mb-6 tracking-tight drop-shadow-lg">
            {homeContent.hero.headline}
          </h1>
          <p className="text-lg md:text-xl text-primary-200 mb-10 max-w-2xl mx-auto font-light tracking-wide">
            {homeContent.hero.subheadline}
          </p>
          <div className="flex justify-center">
            <Button variant="primary" className="text-lg">
              {homeContent.hero.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
