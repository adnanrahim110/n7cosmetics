"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const controlClass = "grid size-11 shrink-0 place-items-center rounded-full border border-primary-800 text-primary-900 hover:bg-primary-900 hover:text-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-primary-900";

export default function BlogSlider({ children }: { children: ReactNode }) {
  const id = useId();
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const list = rail.current;
    if (!list) return;

    const updateEdges = () => {
      const start = list.scrollLeft <= 1;
      const end = list.scrollWidth - list.clientWidth - list.scrollLeft <= 1;
      setEdges((current) => current.start === start && current.end === end ? current : { start, end });
    };

    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    list.addEventListener("scroll", updateEdges, { passive: true });
    updateEdges();
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateEdges);
    };
  }, []);

  function move(direction: -1 | 1) {
    const list = rail.current;
    if (!list || (direction === -1 ? edges.start : edges.end)) return;
    const first = list.children[0];
    const second = list.children[1];
    if (!first || !second) return;

    const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    list.scrollBy({ left: step * direction, behavior: "instant" });
  }

  return (
    <>
      <ul
        className="mt-4 grid snap-x snap-mandatory auto-cols-[85%] grid-flow-col gap-4 overflow-x-auto px-1 pt-1 pb-4 sm:auto-cols-[calc((100%_-_1rem)/2)] lg:auto-cols-[calc((100%_-_2rem)/3)]"
        id={id}
        ref={rail}
      >
        {children}
      </ul>
      {edges.start && edges.end ? null : (
        <div className="mt-2 flex justify-end gap-2" role="group" aria-label="Related blog controls">
          <button aria-controls={id} aria-disabled={edges.start} aria-label="Previous related posts" className={controlClass} onClick={() => move(-1)} type="button">
            <ArrowLeft aria-hidden="true" size={18} />
          </button>
          <button aria-controls={id} aria-disabled={edges.end} aria-label="Next related posts" className={controlClass} onClick={() => move(1)} type="button">
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </>
  );
}
