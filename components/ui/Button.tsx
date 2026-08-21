"use client";

import { useRef, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import { motion } from "motion/react";
import Link from "next/link";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: ButtonVariant;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

export default function Button({ children, href, className = "", variant = "primary", onClick }: ButtonProps) {
  const buttonRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove: MouseEventHandler<HTMLSpanElement> = (e) => {
    if (!buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.2;
    const y = (clientY - (top + height / 2)) * 0.2;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseClasses = "relative inline-flex items-center justify-center overflow-hidden font-medium tracking-widest uppercase transition-all duration-300";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-500 text-dark-950 hover:bg-primary-400 px-8 py-4 text-sm",
    outline: "border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-dark-950 px-8 py-4 text-sm",
    ghost: "text-primary-300 hover:text-primary-100 px-4 py-2 text-sm",
  };

  const Content = (
    <motion.span
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${variants[variant]} ${className}`} onClick={onClick}>
        {Content}
      </Link>
    );
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} onClick={onClick}>
      {Content}
    </button>
  );
}
