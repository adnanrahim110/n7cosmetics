"use client";

import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, Expand, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type { PointerEvent } from "react";
import { useState } from "react";
import ProductImageViewer from "./ProductImageViewer";

interface GalleryItem {
  url: string;
  type: "image" | "video";
  alt: string;
}

function ZoomableGalleryImage({
  item,
  priority,
  onExpand,
}: {
  item: GalleryItem;
  priority: boolean;
  onExpand: () => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [loadOriginal, setLoadOriginal] = useState(false);
  const [originalReady, setOriginalReady] = useState(false);
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });
  const reduceMotion = useReducedMotion();

  function trackPointer(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    });
    setLoadOriginal(true);
    setHovering(true);
  }

  const imageClass =
    "pointer-events-none select-none object-contain p-6 drop-shadow-[0_24px_24px_rgba(38,26,17,0.14)] sm:p-8 lg:p-10";

  return (
    <button
      aria-haspopup="dialog"
      aria-label={`Enlarge ${item.alt}`}
      className="relative block size-full cursor-zoom-in touch-auto overflow-hidden text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#8d6745]"
      onBlur={() => setHovering(false)}
      onClick={() => {
        setHovering(false);
        onExpand();
      }}
      onPointerCancel={() => setHovering(false)}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") setHovering(false);
      }}
      onPointerEnter={trackPointer}
      onPointerLeave={() => setHovering(false)}
      onPointerMove={trackPointer}
      type="button"
    >
      <motion.div
        animate={{
          scale: hovering ? 2.5 : 1,
          originX: origin.x,
          originY: origin.y,
        }}
        className="absolute inset-0"
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      >
        <Image
          alt={item.alt}
          className={imageClass}
          draggable={false}
          fill
          priority={priority}
          sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 64px), (max-width: 1279px) calc(53vw - 60px), 608px"
          src={item.url}
        />
        {loadOriginal ? (
          <Image
            alt=""
            aria-hidden="true"
            className={cn(
              imageClass,
              originalReady ? "opacity-100" : "opacity-0",
            )}
            draggable={false}
            fill
            loading="eager"
            onLoad={() => setOriginalReady(true)}
            src={item.url}
            unoptimized
          />
        ) : null}
      </motion.div>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full border border-black/10 bg-[#f7f2ea]/90 text-[#7A5D38] transition-opacity motion-reduce:transition-none",
          hovering ? "opacity-0" : "opacity-100",
        )}
      >
        <Expand size={17} />
      </span>
    </button>
  );
}

export default function ProductGallery({
  items,
  productName,
}: {
  items: GalleryItem[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const active = items[activeIndex] ?? items[0];
  const hasThumbnails = items.length > 1;
  if (!active) return null;

  return (
    <figure
      aria-label={`${productName} gallery`}
      className={cn(
        "min-w-0 lg:sticky lg:top-20",
        hasThumbnails
          ? "grid gap-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4"
          : "block min-w-0",
      )}
    >
      {hasThumbnails ? (
        <div
          aria-label="Gallery thumbnails"
          className="order-2 flex min-w-0 gap-3 overflow-x-auto p-1 sm:order-0 sm:max-h-144 sm:flex-col sm:overflow-y-auto"
        >
          {items.map((item, index) => (
            <button
              aria-label={`View ${item.type} ${index + 1} of ${items.length}`}
              aria-pressed={activeIndex === index}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-sm bg-[#e9e0d3] transition-opacity focus-visible:ring-2 focus-visible:ring-stone-700 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-full",
                activeIndex === index
                  ? "ring-1 ring-[#1c1814] ring-offset-2 ring-offset-[#f7f3ed]"
                  : "opacity-70 hover:opacity-100",
              )}
              key={`${item.type}-${item.url}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {item.type === "image" ? (
                <Image
                  alt=""
                  className="object-contain p-2"
                  fill
                  sizes="80px"
                  src={item.url}
                />
              ) : (
                <>
                  <video
                    aria-hidden="true"
                    className="size-full object-cover"
                    muted
                    preload="metadata"
                    src={item.url}
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/15 text-white">
                    <Play className="fill-current" size={18} />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative aspect-4/5 w-full min-w-0 overflow-hidden rounded-sm bg-[#e9e0d3] sm:aspect-5/6">
        {active.type === "image" ? (
          <ZoomableGalleryImage
            item={active}
            key={active.url}
            onExpand={() => setViewerOpen(true)}
            priority={activeIndex === 0}
          />
        ) : (
          <video
            aria-label={`${productName} product video`}
            className="size-full bg-black object-contain"
            controls
            playsInline
            preload="metadata"
            src={active.url}
          />
        )}
        {hasThumbnails ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-3 flex items-center justify-between",
              active.type === "video" ? "top-4" : "top-1/2 -translate-y-1/2",
            )}
          >
            {[
              { direction: -1, label: "Previous", icon: ChevronLeft },
              { direction: 1, label: "Next", icon: ChevronRight },
            ].map(({ direction, label, icon: Icon }) => (
              <button
                aria-label={`${label} product image or video`}
                className="pointer-events-auto grid size-11 place-items-center rounded-full border border-stone-900/10 bg-[#f7f3ed]/95 text-stone-900 shadow-sm transition-colors hover:bg-white active:bg-stone-200 focus-visible:ring-2 focus-visible:ring-stone-700 motion-reduce:transition-none"
                key={label}
                onClick={() =>
                  setActiveIndex(
                    (index) =>
                      (index + direction + items.length) % items.length,
                  )
                }
                type="button"
              >
                <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {viewerOpen && active.type === "image" ? (
        <ProductImageViewer
          images={items.filter((item) => item.type === "image")}
          initialIndex={items
            .filter((item) => item.type === "image")
            .indexOf(active)}
          onClose={() => setViewerOpen(false)}
          productName={productName}
        />
      ) : null}
    </figure>
  );
}
