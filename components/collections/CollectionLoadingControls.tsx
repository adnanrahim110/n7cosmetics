"use client";

import { ArrowDown } from "lucide-react";
import { motion } from "motion/react";
import type { RefObject } from "react";
import {
  collectionEase,
  type CollectionDesign,
} from "./collection-config";

interface CollectionLoadingControlsProps {
  usesInfiniteScroll: boolean;
  visibleCount: number;
  totalCount: number;
  design: CollectionDesign;
  shouldReduceMotion: boolean | null;
  triggerRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
}

export default function CollectionLoadingControls({
  usesInfiniteScroll,
  visibleCount,
  totalCount,
  design,
  shouldReduceMotion,
  triggerRef,
  onLoadMore,
}: CollectionLoadingControlsProps) {
  if (visibleCount >= totalCount) return null;

  const progress = `${Math.min(100, (visibleCount / totalCount) * 100)}%`;

  if (usesInfiniteScroll) {
    return (
      <div
        ref={triggerRef}
        role="status"
        aria-live="polite"
        className="mt-24 flex min-h-20 flex-col items-center justify-center"
      >
        <div className="mb-6 h-px w-36 overflow-hidden bg-black/12">
          <motion.div
            className="h-full origin-left"
            initial={false}
            animate={{ width: progress }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
              ease: collectionEase,
            }}
            style={{ backgroundColor: design.accent }}
          />
        </div>
        <div className="flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.28em] text-black/38">
          <motion.span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            animate={
              shouldReduceMotion
                ? undefined
                : { opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }
            }
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ backgroundColor: design.accent }}
          />
          Revealing the next compositions
          <span className="text-black/24">
            {Math.min(visibleCount, totalCount)} / {totalCount}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-24 flex flex-col items-center">
      <div className="mb-6 h-px w-36 overflow-hidden bg-black/12">
        <div
          className="h-full"
          style={{ width: progress, backgroundColor: design.accent }}
        />
      </div>
      <button
        type="button"
        onClick={onLoadMore}
        className="group flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-black/52 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-black"
      >
        Continue the index
        <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-1" />
      </button>
    </div>
  );
}
