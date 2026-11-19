import { googleReviewsPublicOrigin, googleReviewsStorefrontPath, type GoogleReviewsSettings } from "./config";
import type { GoogleReviewSurvey } from "./survey";

export interface GoogleStoreWidgetOptions {
  merchant_id: number; position: GoogleReviewsSettings["widgetPosition"]; region?: string;
  sideMargin: number; bottomMargin: number; mobileSideMargin: number; mobileBottomMargin: number;
}
declare global {
  interface Window {
    merchantwidget?: { start(options: GoogleStoreWidgetOptions): void };
    gapi?: { load(name: "surveyoptin", callback: () => void): void; surveyoptin?: { render(value: GoogleReviewSurvey): void } };
  }
}

let widget: { key: string; element: HTMLElement } | undefined;
export function hideGoogleStoreWidget(): void {
  widget?.element.classList.add("hidden");
  if (widget) widget.element.inert = true;
}

export function showGoogleStoreWidget(settings: GoogleReviewsSettings, origin: string): void {
  if (!settings.widgetEnabled || !settings.merchantId || googleReviewsPublicOrigin(location.origin) !== origin
    || !googleReviewsStorefrontPath(location.pathname) || !window.merchantwidget) { hideGoogleStoreWidget(); return; }
  const options: GoogleStoreWidgetOptions = {
    merchant_id: Number(settings.merchantId), position: settings.widgetPosition,
    ...(settings.widgetRegion ? { region: settings.widgetRegion } : {}),
    sideMargin: 24, bottomMargin: settings.widgetBottomMargin, mobileSideMargin: 16, mobileBottomMargin: settings.widgetMobileBottomMargin,
  };
  const key = JSON.stringify(options);
  if (widget && (!widget.element.isConnected || widget.key !== key)) { widget.element.remove(); widget = undefined; }
  if (!widget) {
    // Google exposes start(), but no public teardown API. Retain its single
    // wrapper across SPA routes and hide/inert it while checkout or a modal is open.
    if (document.getElementById("google-merchantwidget-iframe-wrapper")) return;
    window.merchantwidget.start(options);
    const element = document.getElementById("google-merchantwidget-iframe-wrapper");
    if (!element) return;
    widget = { key, element };
    element.querySelector("iframe")?.setAttribute("title", "Google store ratings and information");
  }
  widget.element.inert = false;
  widget.element.classList.remove("hidden");
}

const shownSurveys = new Set<string>();
export function renderGoogleReviewSurvey(data: GoogleReviewSurvey, active: () => boolean): Promise<boolean> {
  return new Promise(resolve => {
    if (!window.gapi || !active()) { resolve(false); return; }
    const marker = `n7-google-review:${data.merchant_id}:${data.order_id}`;
    const shown = () => {
      if (shownSurveys.has(marker)) return true;
      try { return sessionStorage.getItem(marker) === "shown"; } catch { return false; }
    };
    if (shown()) { resolve(true); return; }
    let expired = false;
    const timer = setTimeout(() => { expired = true; resolve(false); }, 10000);
    try {
      window.gapi.load("surveyoptin", () => {
        clearTimeout(timer);
        if (expired || !active() || location.protocol !== "https:" || location.pathname !== "/checkout/confirmation") { resolve(false); return; }
        if (shown()) { resolve(true); return; }
        try {
          if (!window.gapi?.surveyoptin) { resolve(false); return; }
          window.gapi.surveyoptin.render(data);
          shownSurveys.add(marker);
          // Store only a non-sensitive display marker, never contact details,
          // receipt credentials, or the Google payload.
          try { sessionStorage.setItem(marker, "shown"); } catch { /* In-memory guard still works. */ }
          resolve(true);
        } catch { resolve(false); }
      });
    } catch { clearTimeout(timer); resolve(false); }
  });
}
