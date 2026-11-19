"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import { googleReviewsStorefrontPath, type GoogleReviewsSettings } from "@/lib/google-reviews/config";
import { hideGoogleStoreWidget, showGoogleStoreWidget } from "@/lib/google-reviews/browser";

export default function GoogleStoreWidget({ settings, origin }: { settings: GoogleReviewsSettings; origin: string }) {
  const pathname = usePathname();
  const { isCartOpen } = useCommerce();
  const [ready, setReady] = useState(false);
  const allowed = settings.widgetEnabled && Boolean(origin) && googleReviewsStorefrontPath(pathname);
  useEffect(() => {
    const update = () => {
      const blocked = isCartOpen || document.querySelector('[aria-modal="true"], dialog[open], [data-mobile-purchase-blocker], aside[aria-label="Quick purchase"]');
      if (!ready || !allowed || blocked) { hideGoogleStoreWidget(); return; }
      try { showGoogleStoreWidget(settings, origin); } catch { hideGoogleStoreWidget(); }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "aria-modal", "data-mobile-purchase-blocker"] });
    return () => { observer.disconnect(); hideGoogleStoreWidget(); };
  }, [settings, origin, allowed, ready, isCartOpen]);
  return allowed ? <Script id="google-store-widget" src="https://www.gstatic.com/shopping/merchant/merchantwidget.js" strategy="lazyOnload" onReady={() => setReady(true)} onError={hideGoogleStoreWidget} /> : null;
}
