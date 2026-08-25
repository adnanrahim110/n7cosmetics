"use client";

import Image from "next/image";
import { Expand, ImageIcon, Play } from "lucide-react";
import { useState } from "react";

interface GalleryItem {
  url: string;
  type: "image" | "video";
  alt: string;
}

export default function ProductGallery({ items, productName }: { items: GalleryItem[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? items[0];
  const hasThumbnails = items.length > 1;
  if (!active) return null;

  return (
    <div className={hasThumbnails ? "grid gap-3 sm:grid-cols-[5.25rem_minmax(0,1fr)] sm:gap-4" : "block min-w-0"}>
      {hasThumbnails ? (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-none sm:max-h-[42rem] sm:flex-col sm:overflow-y-auto sm:pb-0 sm:pr-1">
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
                <Image alt="" className="object-contain p-2" fill sizes="84px" src={item.url} />
              ) : (
                <>
                  <video aria-hidden="true" className="size-full object-cover" muted preload="metadata" src={item.url} />
                  <span className="absolute inset-0 grid place-items-center bg-black/15 text-white"><Play className="fill-current" size={18} /></span>
                </>
              )}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative aspect-[4/5] w-full min-w-0 overflow-hidden bg-[#e9e0d3] sm:aspect-[5/6]">
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 bg-white/75 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/55 backdrop-blur">
          {active.type === "image" ? <ImageIcon size={12} /> : <Play size={12} />}
          {active.type === "image" ? "Product view" : "Product film"}
        </div>
        {active.type === "image" ? (
          <Image
            alt={active.alt}
            className="object-contain p-7 drop-shadow-[0_38px_28px_rgba(38,26,17,0.2)] transition-transform duration-700 hover:scale-[1.035] sm:p-10 lg:p-12"
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 52vw"
            src={active.url}
          />
        ) : (
          <video aria-label={`${productName} product video`} className="size-full bg-black object-contain" controls playsInline preload="metadata" src={active.url} />
        )}
        {active.type === "image" ? <Expand aria-hidden="true" className="absolute bottom-5 right-5 text-black/28" size={17} /> : null}
      </div>
    </div>
  );
}
