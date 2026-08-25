"use client";

import { useState } from "react";
import type { StorefrontPageComingSoonContent } from "@/lib/storefront-pages/config";
import AdminToggle from "./AdminToggle";
import MediaDropzone from "./MediaDropzone";

const input = "mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-5 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const label = "block text-[13px] font-medium leading-5 text-zinc-700";

export default function StorefrontComingSoonEditor({
  content,
}: {
  content: StorefrontPageComingSoonContent;
}) {
  const [enabled, setEnabled] = useState(content.enabled);

  return (
    <div className="sm:col-span-2">
      <AdminToggle
        defaultChecked={content.enabled}
        description="Add a premium announcement card to the product grid. Existing products, filters, and sorting remain visible."
        label="Show coming soon card"
        name="showComingSoon"
        onChange={setEnabled}
      />

      <div
        aria-hidden={!enabled}
        className={enabled ? "mt-4 grid gap-x-4 gap-y-3 rounded-xl border border-amber-200/70 bg-amber-50/35 p-4 sm:grid-cols-2" : "hidden"}
      >
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Coming soon card content</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">This content appears as a large editorial card inside the catalog grid.</p>
        </div>
        <label className={label}>
          Eyebrow
          <input className={input} defaultValue={content.eyebrow} maxLength={160} name="comingSoonEyebrow" required={enabled} />
        </label>
        <label className={label}>
          Title
          <input className={input} defaultValue={content.title} maxLength={190} name="comingSoonTitle" required={enabled} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Description
          <textarea className={input} defaultValue={content.description} maxLength={1000} name="comingSoonDescription" required={enabled} rows={3} />
        </label>
        <MediaDropzone
          accept="image"
          className="sm:col-span-2"
          defaultAssets={content.image ? [{ url: content.image, name: content.title || "Coming soon visual", type: "image" }] : []}
          hint="Optional. Use a transparent product image or refined campaign visual; the card also has a premium text-only treatment."
          label="Card image"
          name="comingSoonImage"
        />
      </div>
    </div>
  );
}
