"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

interface ScentNoteGroup {
  label: string;
  caption: string;
  notes: string[];
}

export default function ScentNotesAccordion({
  groups,
}: {
  groups: ScentNoteGroup[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const contentId = useId();

  if (!groups.length) return null;

  return (
    <section className="mt-6 border-y border-black/12">
      <button
        aria-controls={contentId}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer select-none items-center justify-between py-4 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6745] outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55]"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span>Scent notes</span>
        <ChevronDown
          aria-hidden="true"
          className={`transition-transform duration-400 ease-[0.22,1,0.36,1] ${isOpen ? "rotate-180" : ""}`}
          size={15}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className={`overflow-hidden ${isAnimating ? "select-none" : ""}`}
            exit={{ height: 0, opacity: 0 }}
            id={contentId}
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            key="scent-notes-content"
            onAnimationComplete={() => setIsAnimating(false)}
            onAnimationStart={() => setIsAnimating(true)}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    height: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.24, ease: "easeOut" },
                  }
            }
          >
            <div className="border-t border-black/10 pb-5 pt-4">
              <div
                className={`grid gap-px overflow-hidden border border-black/10 bg-black/10 ${groups.length === 3 ? "sm:grid-cols-3" : groups.length === 2 ? "sm:grid-cols-2" : ""}`}
              >
                {groups.map((group) => (
                  <div
                    className="min-w-0 bg-[#f3eee5] p-4"
                    key={group.label}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8D6745]">
                      {group.caption}
                    </p>
                    <p className="mt-3 text-sm font-light leading-6 text-black/62">
                      {group.notes.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
