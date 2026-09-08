"use client";

import type { ImageZoom, ZoomPoint, ZoomSize } from "@/lib/commerce/image-zoom";
import {
  constrainImageZoom,
  fitImage,
  INITIAL_IMAGE_ZOOM,
  MAX_IMAGE_ZOOM,
  pinchGeometry,
  zoomImageAt,
} from "@/lib/commerce/image-zoom";
import { useLenis } from "lenis/react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent, PointerEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface ViewerImage {
  url: string;
  alt: string;
}
type Gesture =
  | { type: "pan"; start: ZoomPoint; zoom: ImageZoom }
  | { type: "pinch"; start: ZoomPoint; distance: number; zoom: ImageZoom };

const controlClass =
  "grid size-11 shrink-0 place-items-center rounded-full border border-black/15 bg-white/60 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745] disabled:cursor-not-allowed disabled:opacity-30";

function ZoomCanvas({ image }: { image: ViewerImage }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, ZoomPoint>());
  const gesture = useRef<Gesture | null>(null);
  const tap = useRef<{ id: number; start: ZoomPoint; time: number } | null>(
    null,
  );
  const lastTap = useRef<{ point: ZoomPoint; time: number } | null>(null);
  const latest = useRef(INITIAL_IMAGE_ZOOM);
  const frame = useRef<number | null>(null);
  const bounds = useRef({
    viewport: { width: 0, height: 0 },
    image: { width: 0, height: 0 },
  });
  const [zoom, setZoom] = useState(INITIAL_IMAGE_ZOOM);
  const [naturalSize, setNaturalSize] = useState<ZoomSize>({
    width: 1,
    height: 1,
  });
  const [imageSize, setImageSize] = useState<ZoomSize>({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const helpId = useId();

  const applyZoom = useCallback((next: ImageZoom) => {
    latest.current = next;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setZoom(latest.current);
    });
  }, []);

  const clearGesture = useCallback(() => {
    pointers.current.clear();
    gesture.current = null;
    tap.current = null;
    lastTap.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      const viewport = { width: stage.clientWidth, height: stage.clientHeight };
      const fitted = fitImage(naturalSize, viewport);
      bounds.current = { viewport, image: fitted };
      setImageSize(fitted);
      clearGesture();
      applyZoom(constrainImageZoom(latest.current, fitted, viewport));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [naturalSize, applyZoom, clearGesture]);

  useEffect(() => {
    window.addEventListener("blur", clearGesture);
    return () => {
      window.removeEventListener("blur", clearGesture);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [clearGesture]);

  function pointAt(event: PointerEvent<HTMLDivElement>): ZoomPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    };
  }

  function rebaseGesture() {
    const [first, second] = [...pointers.current.values()];
    gesture.current = second
      ? {
          type: "pinch",
          start: pinchGeometry(first, second).midpoint,
          distance: pinchGeometry(first, second).distance,
          zoom: latest.current,
        }
      : first
        ? { type: "pan", start: first, zoom: latest.current }
        : null;
    setDragging(Boolean(first));
  }

  function changeScale(scale: number, point: ZoomPoint = { x: 0, y: 0 }) {
    applyZoom(
      zoomImageAt(
        latest.current,
        scale,
        point,
        bounds.current.image,
        bounds.current.viewport,
      ),
    );
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      !loaded ||
      failed ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    const point = pointAt(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, point);
    tap.current =
      pointers.current.size === 1
        ? { id: event.pointerId, start: point, time: performance.now() }
        : null;
    if (pointers.current.size > 1) lastTap.current = null;
    rebaseGesture();
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const point = pointAt(event);
    pointers.current.set(event.pointerId, point);
    if (
      tap.current &&
      Math.hypot(point.x - tap.current.start.x, point.y - tap.current.start.y) >
        8
    )
      tap.current = null;
    const current = gesture.current;
    if (!current) return;
    const [first, second] = [...pointers.current.values()];
    if (current.type === "pinch" && second) {
      const pinch = pinchGeometry(first, second);
      applyZoom(
        zoomImageAt(
          current.zoom,
          (current.zoom.scale * pinch.distance) / current.distance,
          current.start,
          bounds.current.image,
          bounds.current.viewport,
          pinch.midpoint,
        ),
      );
    } else if (current.type === "pan") {
      applyZoom(
        constrainImageZoom(
          {
            ...current.zoom,
            x: current.zoom.x + first.x - current.start.x,
            y: current.zoom.y + first.y - current.start.y,
          },
          bounds.current.image,
          bounds.current.viewport,
        ),
      );
    }
  }

  function pointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    if (!pointers.current.has(event.pointerId)) return;
    const candidate = tap.current;
    if (
      !cancelled &&
      candidate?.id === event.pointerId &&
      performance.now() - candidate.time < 300
    ) {
      const point = pointAt(event);
      const previous = lastTap.current;
      const now = performance.now();
      if (
        previous &&
        now - previous.time < 300 &&
        Math.hypot(point.x - previous.point.x, point.y - previous.point.y) < 36
      ) {
        changeScale(latest.current.scale > 1 ? 1 : 2.5, point);
        lastTap.current = null;
      } else lastTap.current = { point, time: now };
    }
    tap.current = null;
    if (cancelled) lastTap.current = null;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    rebaseGesture();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || !loaded || failed)
      return;
    const key = event.key;
    if (
      ![
        "+",
        "=",
        "-",
        "0",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(key)
    )
      return;
    event.preventDefault();
    if (key === "+" || key === "=") changeScale(latest.current.scale + 0.5);
    else if (key === "-") changeScale(latest.current.scale - 0.5);
    else if (key === "0") changeScale(1);
    else
      applyZoom(
        constrainImageZoom(
          {
            ...latest.current,
            x:
              latest.current.x +
              (key === "ArrowLeft" ? 48 : key === "ArrowRight" ? -48 : 0),
            y:
              latest.current.y +
              (key === "ArrowUp" ? 48 : key === "ArrowDown" ? -48 : 0),
          },
          bounds.current.image,
          bounds.current.viewport,
        ),
      );
  }

  return (
    <>
      <div
        aria-label="Zoomable product image"
        aria-describedby={helpId}
        className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8d6745] ${zoom.scale > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"}`}
        data-lenis-prevent
        onKeyDown={handleKeyDown}
        onLostPointerCapture={(event) => pointerEnd(event, true)}
        onPointerCancel={(event) => pointerEnd(event, true)}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={(event) => pointerEnd(event)}
        ref={stageRef}
        role="region"
        tabIndex={0}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform"
          style={{
            width: imageSize.width,
            height: imageSize.height,
            marginLeft: -imageSize.width / 2,
            marginTop: -imageSize.height / 2,
            transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`,
          }}
        >
          <Image
            alt={image.alt}
            className={`object-contain ${loaded ? "opacity-100" : "opacity-0"}`}
            draggable={false}
            fill
            loading="eager"
            onError={() => setFailed(true)}
            onLoad={(event) => {
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
              setLoaded(true);
            }}
            src={image.url}
            unoptimized
          />
        </div>
        {!loaded && !failed ? (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-black/50"
            role="status"
          >
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              size={18}
            />
            Loading image…
          </span>
        ) : null}
        {failed ? (
          <p
            className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-black/60"
            role="alert"
          >
            This image could not be loaded. Please try another gallery image.
          </p>
        ) : null}
      </div>
      <div className="shrink-0 border-t border-black/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center justify-center gap-3">
          <button
            aria-label="Zoom out"
            className={controlClass}
            disabled={!loaded || failed || zoom.scale <= 1}
            onClick={() => changeScale(latest.current.scale - 0.5)}
            type="button"
          >
            <Minus size={18} />
          </button>
          <output
            aria-label="Image zoom level"
            className="w-14 text-center font-mono text-sm tabular-nums"
          >
            {Math.round(zoom.scale * 100)}%
          </output>
          <button
            aria-label="Zoom in"
            className={controlClass}
            disabled={!loaded || failed || zoom.scale >= MAX_IMAGE_ZOOM}
            onClick={() => changeScale(latest.current.scale + 0.5)}
            type="button"
          >
            <Plus size={18} />
          </button>
          <button
            aria-label="Reset image zoom"
            className={controlClass}
            disabled={!loaded || failed || zoom.scale === 1}
            onClick={() => changeScale(1)}
            type="button"
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-black/50" id={helpId}>
          Pinch or double-tap to zoom · Drag to explore
          <span className="sr-only">
            . Keyboard: plus and minus to zoom, arrow keys to pan, zero to
            reset, Escape to close.
          </span>
        </p>
      </div>
    </>
  );
}

export default function ProductImageViewer({
  images,
  initialIndex,
  productName,
  onClose,
}: {
  images: ViewerImage[];
  initialIndex: number;
  productName: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const lenis = useLenis();
  const active = images[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const wasStopped = lenis?.isStopped;
    lenis?.stop();
    body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`;
    Object.assign(body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      width: "100%",
      overflow: "hidden",
    });
    dialog.showModal();
    return () => {
      dialog.close();
      Object.assign(body.style, previous);
      window.scrollTo({ top: scrollY, behavior: "instant" });
      if (!wasStopped) lenis?.start();
      focused?.focus({ preventScroll: true });
    };
  }, [lenis]);

  return (
    <dialog
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none flex-col overflow-hidden overscroll-none border-0 bg-[#f3eee5] p-0 text-[#1c1814] backdrop:bg-[#1c1814]/70 open:flex"
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="min-w-0 flex-1">
          <h2
            className="truncate font-heading text-xl text-primary-600 sm:text-4xl"
            id={titleId}
          >
            {productName}
          </h2>
        </div>
        {images.length > 1 ? (
          <div className="flex gap-2">
            <button
              aria-label="Previous product image"
              className={controlClass}
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              type="button"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              aria-label="Next product image"
              className={controlClass}
              disabled={index === images.length - 1}
              onClick={() => setIndex(index + 1)}
              type="button"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        ) : null}
        <button
          aria-label="Close image viewer"
          autoFocus
          className={controlClass}
          onClick={onClose}
          type="button"
        >
          <X size={19} />
        </button>
      </header>
      <ZoomCanvas image={active} key={`${index}-${active.url}`} />
    </dialog>
  );
}
