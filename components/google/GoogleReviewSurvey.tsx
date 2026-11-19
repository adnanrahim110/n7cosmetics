"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { googleReviewSurveySchema, type GoogleReviewSurvey } from "@/lib/google-reviews/survey";
import { renderGoogleReviewSurvey } from "@/lib/google-reviews/browser";

export default function GoogleReviewSurvey({ checkoutKey }: { checkoutKey: string }) {
  const [survey, setSurvey] = useState<GoogleReviewSurvey | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [scriptRetry, setScriptRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (location.protocol !== "https:") return;
      try {
        const response = await fetch("/api/google/customer-reviews", { method: "POST", credentials: "same-origin", cache: "no-store",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: checkoutKey }),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (response.status === 204) return;
        if (!response.ok) throw new Error("Review invitation unavailable");
        const data = googleReviewSurveySchema.parse(await response.json());
        if (!controller.signal.aborted) {
          // Remove receipt/Stripe credentials before any Google script loads,
          // including when browser storage is blocked.
          window.history.replaceState(window.history.state, "", location.pathname);
          setSurvey(data); setError(false);
        }
      } catch { if (!controller.signal.aborted) setError(true); }
    }
    void load();
    return () => controller.abort();
  }, [checkoutKey, retry]);
  useEffect(() => {
    if (!survey || !ready) return;
    let active = true, rendering = false;
    const show = () => {
      if (rendering || document.querySelector('[aria-modal="true"], dialog[open], [data-mobile-purchase-blocker]')) return;
      rendering = true;
      void renderGoogleReviewSurvey(survey, () => active).then(success => { if (active) setError(!success); });
    };
    const observer = new MutationObserver(show);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "aria-modal", "data-mobile-purchase-blocker"] });
    show();
    return () => { active = false; observer.disconnect(); };
  }, [survey, ready, retry]);
  return <>
    {survey ? <>
      <Script id={`google-customer-review-survey-${scriptRetry}`} src={`https://apis.google.com/js/platform.js${scriptRetry ? `?retry=${scriptRetry}` : ""}`} strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setError(true)} />
      <p className="mt-4 text-xs leading-5 text-stone-600">Google Customer Reviews lets you choose whether to receive a survey after delivery. <Link href="/privacy#google-reviews" className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700">Review privacy details</Link>.</p>
    </> : null}
    {error ? <p className="mt-4 text-sm text-stone-700" role="status">Google’s review invitation is temporarily unavailable. <button type="button" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700" onClick={() => { setError(false); if (!ready) setScriptRetry(value => value + 1); setRetry(value => value + 1); }}>Try again</button></p> : null}
  </>;
}
