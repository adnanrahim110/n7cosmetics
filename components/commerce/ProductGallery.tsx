"use client";

import { Expand, Play } from "lucide-react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
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
  const originX = useMotionValue(0.5);
  const originY = useMotionValue(0.5);
  const reduceMotion = useReducedMotion();

  function trackPointer(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    originX.set(
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    );
    originY.set(
      Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    );
    setLoadOriginal(true);
    setHovering(true);
  }

  const imageClass =
    "pointer-events-none select-none object-contain p-7 drop-shadow-[0_38px_28px_rgba(38,26,17,0.2)] sm:p-10 lg:p-12";

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
        animate={{ scale: hovering ? 2.5 : 1 }}
        className="absolute inset-0"
        style={{ originX, originY }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      >
        <Image
          alt={item.alt}
          className={imageClass}
          draggable={false}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 52vw"
          src={item.url}
        />
        {loadOriginal ? (
          <Image
            alt=""
            aria-hidden="true"
            className={`${imageClass} ${originalReady ? "opacity-100" : "opacity-0"}`}
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
        className={`pointer-events-none absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border border-black/10 bg-[#f7f2ea]/90 text-[#7A5D38] transition-opacity motion-reduce:transition-none ${hovering ? "opacity-0" : "opacity-100"}`}
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
    <div
      className={
        hasThumbnails
          ? "grid gap-3 sm:grid-cols-[5.25rem_minmax(0,1fr)] sm:gap-4"
          : "block min-w-0"
      }
    >
      {hasThumbnails ? (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-0 sm:max-h-168 sm:flex-col sm:overflow-y-auto sm:pb-0 sm:pr-1">
          {items.map((item, index) => (
            <button
              aria-label={`View ${item.type} ${index + 1} of ${items.length}`}
              aria-pressed={activeIndex === index}
              className={`relative aspect-square w-19 shrink-0 overflow-hidden bg-[#e9e0d3] transition sm:w-full ${activeIndex === index ? "ring-1 ring-[#1c1814] ring-offset-2 ring-offset-[#f3eee5]" : "opacity-65 hover:opacity-100"}`}
              key={`${item.type}-${item.url}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {item.type === "image" ? (
                <Image
                  alt=""
                  className="object-contain p-2"
                  fill
                  sizes="84px"
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

      <div className="relative aspect-4/5 w-full min-w-0 overflow-hidden bg-[#e9e0d3] sm:aspect-5/6">
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
    </div>
  );
}
