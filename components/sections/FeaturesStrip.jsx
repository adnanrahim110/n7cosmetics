"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaTruck, FaShieldAlt, FaHeadset } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesStrip() {
  const stripRef = useRef(null);

  const features = [
    { icon: FaTruck, title: "Worldwide Shipping", subtitle: "Fast & reliable" },
    { icon: FaShieldAlt, title: "100% Secure Payments", subtitle: "Encrypted transactions" },
    { icon: FaHeadset, title: "24/7 Customer Service", subtitle: "Always here for you" },
  ];

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(".feature-item", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: stripRef.current,
          start: "top 90%",
        }
      });
    }, stripRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={stripRef} className="py-12 bg-primary-950/30 border-y border-primary-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="feature-item flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-dark-950 flex items-center justify-center border border-primary-500/30 text-primary-400">
                  <Icon size={24} />
                </div>
                <div>
                  <h4 className="font-heading text-lg text-primary-200 tracking-wider uppercase mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-dark-300 text-sm font-light">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
