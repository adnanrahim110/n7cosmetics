"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/cn";

export type TitleTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type TitleVariant =
  | "display"
  | "section"
  | "subsection"
  | "compact"
  | "small"
  | "custom";
export type TitleTone =
  | "ink"
  | "charcoal"
  | "gold"
  | "ivory"
  | "cream"
  | "cocoa"
  | "sage"
  | "rose"
  | "weekly"
  | "custom";

export interface TitleProps {
  as?: TitleTag;
  className?: string;
  highlight?: string;
  highlightClassName?: string;
  id?: string;
  text: string;
  tone?: TitleTone;
  variant?: TitleVariant;
}

const titleVariants: Record<TitleVariant, string> = {
  display:
    "text-[clamp(2.5rem,11vw,3.35rem)] leading-[0.94] tracking-[-0.035em] sm:text-[clamp(3.25rem,5.5vw,5.75rem)]",
  section:
    "text-[clamp(2.15rem,9vw,2.75rem)] leading-[0.98] tracking-[0.025em] sm:text-[clamp(2.75rem,4.6vw,4.75rem)]",
  subsection:
    "text-[clamp(1.65rem,7vw,2.15rem)] leading-[1.04] tracking-[0.02em] sm:text-[clamp(2rem,3.4vw,3.25rem)]",
  compact: "text-2xl leading-tight tracking-[0.02em] sm:text-3xl",
  small: "text-xl leading-tight tracking-[0.02em] sm:text-2xl",
  custom: "",
};

const titleTones: Record<TitleTone, { title: string; highlight: string }> = {
  ink: { title: "text-[#1c1814]", highlight: "text-[#8d6745]" },
  charcoal: { title: "text-[#1a1a1a]", highlight: "text-[#967C55]" },
  gold: { title: "text-primary-300", highlight: "text-[#967C55]" },
  ivory: { title: "text-[#f7f0e8]", highlight: "text-[#b99a6c]" },
  cream: { title: "text-[#f4eadf]", highlight: "text-[#c99b69]" },
  cocoa: { title: "text-[#211a15]", highlight: "text-[#9b6a35]" },
  sage: { title: "text-[#17201d]", highlight: "text-[#756449]" },
  rose: { title: "text-[#241a17]", highlight: "text-[#815b4c]" },
  weekly: { title: "text-[#1a1713]", highlight: "text-[#a67c49]" },
  custom: { title: "", highlight: "" },
};

const defaultVariants: Record<TitleTag, TitleVariant> = {
  h1: "display",
  h2: "section",
  h3: "subsection",
  h4: "compact",
  h5: "small",
  h6: "small",
};

const headingElements = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
};

const revealEase = [0.22, 1, 0.36, 1] as const;

export default function Title({
  as = "h2",
  className,
  highlight,
  highlightClassName,
  id,
  text,
  tone = "ink",
  variant,
}: TitleProps) {
  const shouldReduceMotion = useReducedMotion();
  const Heading = headingElements[as] as typeof motion.h2;
  const resolvedVariant = variant ?? defaultVariants[as];
  const normalizedText = text.toLocaleLowerCase();
  const normalizedHighlight = highlight?.trim().toLocaleLowerCase();
  const highlightIndex = normalizedHighlight
    ? normalizedText.indexOf(normalizedHighlight)
    : -1;
  const matchedHighlight =
    highlightIndex >= 0 && normalizedHighlight
      ? text.slice(highlightIndex, highlightIndex + normalizedHighlight.length)
      : undefined;

  return (
    <Heading
      className={cn(
        "whitespace-normal wrap-break-word font-heading",
        titleVariants[resolvedVariant],
        titleTones[tone].title,
        className,
      )}
      id={id}
      initial={false}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.85,
        ease: revealEase,
      }}
      viewport={{ once: true, margin: "-60px" }}
      whileInView={
        shouldReduceMotion
          ? undefined
          : { opacity: [0, 1], y: [24, 0] }
      }
    >
      {matchedHighlight ? (
        <>
          {text.slice(0, highlightIndex)}
          <span
            className={cn(
              "inline font-light italic tracking-normal",
              titleTones[tone].highlight,
              highlightClassName,
            )}
          >
            {matchedHighlight}
          </span>
          {text.slice(highlightIndex + matchedHighlight.length)}
        </>
      ) : (
        text
      )}
    </Heading>
  );
}
