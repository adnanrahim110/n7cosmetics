"use client";

import { usePathname } from "next/navigation";

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (element: HTMLElement) => void };
  }
}

function activateTrustBox(element: HTMLDivElement | null) {
  if (!element) return;

  // Let React hydrate the fallback before Trustpilot replaces it with its widget.
  element.classList.add("trustpilot-widget");
  if (document.readyState !== "loading") window.Trustpilot?.loadFromElement(element);
}

export default function TrustpilotReviewCollector() {
  const pathname = usePathname();
  const reviewLink = (
    <a
      className="inline-flex min-h-13 items-center rounded-sm text-sm text-white/80 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
      href="https://www.trustpilot.com/review/n7cosmetics.co.uk"
      target="_blank"
      rel="noopener noreferrer"
    >
      Review us on Trustpilot
    </a>
  );

  // The bootstrap reports the page URL when a widget is active.
  if (/^\/(?:checkout|newsletter)(?:\/|$)/.test(pathname)) return reviewLink;

  return (
    <>
      {/* React hoists async external scripts into the document head. */}
      <script
        type="text/javascript"
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        async
        referrerPolicy="no-referrer"
      />
      <div
        ref={activateTrustBox}
        className="min-h-13 w-full max-w-96"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="67f43d4dd68b154e79a1d614"
        data-style-height="52px"
        data-style-width="100%"
      >
        {reviewLink}
      </div>
    </>
  );
}
