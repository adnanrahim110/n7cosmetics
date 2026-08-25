"use client";

import type { CSSProperties, RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

type DropdownPlacement = "top" | "bottom";

interface AnchoredDropdownOptions {
  minimumWidth?: number;
  offset?: number;
  preferredHeight?: number;
}

interface AnchoredDropdownState {
  placement: DropdownPlacement;
  portalTarget: HTMLElement | null;
  style: CSSProperties;
  updatePosition: () => void;
}

export function useBodyAnchoredDropdown(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  { minimumWidth = 224, offset = 5, preferredHeight = 340 }: AnchoredDropdownOptions = {},
): AnchoredDropdownState {
  const [placement, setPlacement] = useState<DropdownPlacement>("bottom");
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", visibility: "hidden", zIndex: 1000 });
  const portalTarget = typeof document === "undefined" ? null : document.body;

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportMargin = 8;
    const maximumWidth = Math.max(0, window.innerWidth - viewportMargin * 2);
    const width = Math.min(Math.max(rect.width, minimumWidth), maximumWidth);
    const left = Math.min(Math.max(rect.left, viewportMargin), Math.max(viewportMargin, window.innerWidth - width - viewportMargin));
    const below = Math.max(0, window.innerHeight - rect.bottom - offset - viewportMargin);
    const above = Math.max(0, rect.top - offset - viewportMargin);
    const nextPlacement: DropdownPlacement = below < Math.min(preferredHeight, 240) && above > below ? "top" : "bottom";
    const availableHeight = nextPlacement === "top" ? above : below;
    const anchoredEdge = nextPlacement === "top"
      ? { bottom: window.innerHeight - rect.top + offset, top: undefined }
      : { top: rect.bottom + offset, bottom: undefined };

    setPlacement(nextPlacement);
    setStyle({
      position: "fixed",
      left,
      width,
      maxWidth: maximumWidth,
      maxHeight: Math.max(96, Math.min(preferredHeight, availableHeight)),
      visibility: "visible",
      zIndex: 1000,
      ...anchoredEdge,
    });
  }, [anchorRef, minimumWidth, offset, preferredHeight]);

  useLayoutEffect(() => {
    if (!open || !portalTarget) return;
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, portalTarget, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const update = () => updatePosition();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const observer = typeof ResizeObserver === "undefined" || !anchorRef.current ? null : new ResizeObserver(update);
    if (observer && anchorRef.current) observer.observe(anchorRef.current);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
    };
  }, [anchorRef, open, updatePosition]);

  return { placement, portalTarget, style, updatePosition };
}
