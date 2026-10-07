"use client";

import { useState } from "react";
import type { FaqContent } from "@/lib/homepage/types";
import FaqItem from "./FaqItem";

export default function FaqAccordion({ items }: { items: FaqContent[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <div className="min-w-0 border-t border-[#967C55]/30">
      {items.map((item, index) => (
        <FaqItem
          index={index}
          isActive={activeIndex === index}
          item={item}
          key={index}
          onToggle={() => setActiveIndex((current) => current === index ? null : index)}
        />
      ))}
    </div>
  );
}
