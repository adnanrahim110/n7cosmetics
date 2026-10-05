"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import { scheduleAfterLoad } from "@/lib/browser/schedule-after-load";

const CartDrawer = dynamic(() => import("@/components/commerce/CartDrawer"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), { ssr: false });

function DeferredCartDrawer() {
  const { isCartOpen } = useCommerce();
  const [loaded, setLoaded] = useState(false);
  const ready = useCallback(() => setLoaded(true), []);

  // Retain the drawer after first opening so its exit animation and focus cleanup run.
  return isCartOpen || loaded ? <CartDrawer onReady={ready} /> : null;
}

export default function StorefrontOverlays() {
  const [cursorEnabled, setCursorEnabled] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const cancel = scheduleAfterLoad(() => setCursorEnabled(pointer.matches));
    const changed = () => setCursorEnabled(pointer.matches);
    pointer.addEventListener("change", changed);
    return () => { cancel(); pointer.removeEventListener("change", changed); };
  }, []);

  return <><DeferredCartDrawer />{cursorEnabled ? <CustomCursor /> : null}</>;
}
