"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return undefined;
    let initialized = false;
    let visible = false;
    let hovering = false;
    let position: { x: number; y: number } | null = null;
    let refreshFrame = 0;
    const nativeAreas = 'iframe, object, embed, [data-cursor="native"]';
    const nativeHoverAreas = 'iframe:hover, object:hover, embed:hover, [data-cursor="native"]:hover';
    const trackedAreas = new Set<Element>();

    cursor.dataset.visible = "false";
    cursor.dataset.hovering = "false";

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });

    const isNativeArea = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest(nativeAreas));

    const hideCursor = () => {
      initialized = false;
      xTo.tween.pause();
      yTo.tween.pause();
      visible = false;
      hovering = false;
      cursor.dataset.visible = "false";
      cursor.dataset.hovering = "false";
    };

    const stopFollowing = () => {
      position = null;
      hideCursor();
    };

    const followCursor = (x: number, y: number, target: Element | null) => {
      if (!target || document.hidden || document.pointerLockElement || x < 0 || y < 0 || x >= document.documentElement.clientWidth || y >= document.documentElement.clientHeight || isNativeArea(target)) {
        hideCursor();
        return;
      }

      if (!initialized) {
        // Reset both tween origins so returning from an embed never flies in from the old position.
        gsap.set(cursor, { x, y });
        xTo(x, x);
        yTo(y, y);
        initialized = true;
      } else {
        xTo(x);
        yTo(y);
      }
      if (!visible) { visible = true; cursor.dataset.visible = "true"; }

      const interactive = Boolean(target.closest("a, button, .swiper-slide")) && !target.closest("header, [data-header-nav]");
      if (hovering !== interactive) { hovering = interactive; cursor.dataset.hovering = String(interactive); }
    };

    const moveCursor = (event: MouseEvent) => {
      position = { x: event.clientX, y: event.clientY };
      if (event.composedPath().some(isNativeArea)) { hideCursor(); return; }
      followCursor(position.x, position.y, document.elementFromPoint(position.x, position.y));
    };

    const handlePointerOut = (event: MouseEvent) => {
      // Crossing a document/iframe boundary can provide no related target.
      if (!event.relatedTarget || isNativeArea(event.relatedTarget)) stopFollowing();
    };

    const handleEmbeddedEnter = (event: PointerEvent) => {
      if (isNativeArea(event.target)) stopFollowing();
    };

    const syncNativeAreas = () => {
      for (const area of trackedAreas) {
        if (!area.isConnected || !area.matches(nativeAreas)) {
          area.removeEventListener("mouseenter", stopFollowing);
          area.removeEventListener("pointerenter", stopFollowing);
          area.removeEventListener("focus", stopFollowing);
          trackedAreas.delete(area);
        }
      }
      for (const area of document.querySelectorAll(nativeAreas)) {
        if (trackedAreas.has(area)) continue;
        area.addEventListener("mouseenter", stopFollowing);
        area.addEventListener("pointerenter", stopFollowing);
        area.addEventListener("focus", stopFollowing);
        trackedAreas.add(area);
      }
      if (document.querySelector(nativeHoverAreas)) stopFollowing();
    };

    // Stripe inserts its frames asynchronously; bind native boundary events when they arrive.
    syncNativeAreas();
    const nativeObserver = new MutationObserver(syncNativeAreas);
    nativeObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-cursor"] });

    const handleNativeHide = (event: TransitionEvent) => {
      if (event.target === cursor && event.propertyName === "opacity" && document.querySelector(nativeHoverAreas)) stopFollowing();
    };

    const refreshTarget = () => {
      if (!position || refreshFrame) return;
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0;
        if (position) followCursor(position.x, position.y, document.elementFromPoint(position.x, position.y));
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopFollowing();
    };

    const handlePointerLock = () => {
      if (document.pointerLockElement) stopFollowing();
    };

    window.addEventListener("mousemove", moveCursor, { capture: true, passive: true });
    document.addEventListener("mouseover", moveCursor, true);
    document.addEventListener("mouseout", handlePointerOut, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    document.addEventListener("pointerenter", handleEmbeddedEnter, true);
    document.documentElement.addEventListener("pointerleave", stopFollowing);
    document.documentElement.addEventListener("mouseleave", stopFollowing);
    cursor.addEventListener("transitionrun", handleNativeHide);
    document.addEventListener("pointercancel", stopFollowing, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pointerlockchange", handlePointerLock);
    document.addEventListener("contextmenu", stopFollowing, true);
    document.addEventListener("dragstart", stopFollowing, true);
    window.addEventListener("blur", stopFollowing);
    window.addEventListener("scroll", refreshTarget, { capture: true, passive: true });
    window.addEventListener("resize", refreshTarget);

    return () => {
      window.removeEventListener("mousemove", moveCursor, true);
      document.removeEventListener("mouseover", moveCursor, true);
      document.removeEventListener("mouseout", handlePointerOut, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      document.removeEventListener("pointerenter", handleEmbeddedEnter, true);
      document.documentElement.removeEventListener("pointerleave", stopFollowing);
      document.documentElement.removeEventListener("mouseleave", stopFollowing);
      cursor.removeEventListener("transitionrun", handleNativeHide);
      document.removeEventListener("pointercancel", stopFollowing, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("pointerlockchange", handlePointerLock);
      document.removeEventListener("contextmenu", stopFollowing, true);
      document.removeEventListener("dragstart", stopFollowing, true);
      window.removeEventListener("blur", stopFollowing);
      window.removeEventListener("scroll", refreshTarget, true);
      window.removeEventListener("resize", refreshTarget);
      nativeObserver.disconnect();
      for (const area of trackedAreas) {
        area.removeEventListener("mouseenter", stopFollowing);
        area.removeEventListener("pointerenter", stopFollowing);
        area.removeEventListener("focus", stopFollowing);
      }
      trackedAreas.clear();
      if (refreshFrame) {
        window.cancelAnimationFrame(refreshFrame);
      }
      xTo.tween.kill();
      yTo.tween.kill();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-custom-cursor=""
      data-visible="false"
      data-hovering="false"
      ref={cursorRef}
      className="group/cursor pointer-events-none fixed left-0 top-0 z-[9999] hidden mix-blend-difference transition-opacity duration-150 will-change-transform md:block motion-reduce:hidden motion-reduce:transition-none [body:has(iframe:hover,object:hover,embed:hover,[data-cursor=native]:hover)_&]:opacity-0"
    >
      <div className="relative translate-x-2 scale-50 opacity-0 transition duration-150 ease-out group-data-[visible=true]/cursor:translate-x-0 group-data-[visible=true]/cursor:scale-100 group-data-[visible=true]/cursor:opacity-100 motion-reduce:transition-none">
        <div className="absolute left-0 top-0 size-8 -translate-x-1/2 -translate-y-1/2 scale-100 rounded-full border border-white bg-transparent opacity-60 transition duration-300 ease-out group-data-[hovering=true]/cursor:scale-[2.5] group-data-[hovering=true]/cursor:border-transparent group-data-[hovering=true]/cursor:bg-white group-data-[hovering=true]/cursor:opacity-100 motion-reduce:transition-none" />
        <div className="absolute left-0 top-0 size-1 -translate-x-1/2 -translate-y-1/2 scale-100 rounded-full bg-white opacity-100 transition duration-300 ease-out group-data-[hovering=true]/cursor:scale-50 group-data-[hovering=true]/cursor:opacity-0 motion-reduce:transition-none" />
      </div>
    </div>
  );
}
