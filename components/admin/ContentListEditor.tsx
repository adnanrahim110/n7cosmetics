"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { destinationFromHref } from "@/lib/admin/destination";
import type { FooterLink, ReviewContent } from "@/lib/homepage/types";
import DestinationSelect from "./DestinationSelect";

const input = "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-5 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";

export function ReviewsEditor({ defaultItems }: { defaultItems: ReviewContent[] }) {
  const [items, setItems] = useState(defaultItems);
  return <div><input name="reviewsJson" type="hidden" value={JSON.stringify(items)} /><div className="space-y-2">{items.map((item, index) => <div className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5 sm:grid-cols-[170px_1fr_auto]" key={index}><input aria-label={`Review ${index + 1} author`} className={input} maxLength={120} onChange={(event) => setItems((current) => current.map((review, itemIndex) => itemIndex === index ? { ...review, author: event.target.value } : review))} placeholder="Author" required value={item.author} /><textarea aria-label={`Review ${index + 1} text`} className={input} maxLength={1000} onChange={(event) => setItems((current) => current.map((review, itemIndex) => itemIndex === index ? { ...review, text: event.target.value } : review))} placeholder="Review" required rows={2} value={item.text} /><button aria-label="Remove review" className="grid size-9 place-items-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={13} /></button></div>)}</div><button className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold" onClick={() => setItems((current) => [...current, { author: "", text: "" }])} type="button"><Plus size={13} />Add review</button></div>;
}
export function FooterLinksEditor({ defaultItems }: { defaultItems: FooterLink[] }) {
  const [items, setItems] = useState(() => defaultItems.map((item, index) => ({ ...item, key: `footer-${index}-${item.href}` })));
  const serialized = items.map(({ label, href }) => ({ label, href }));
  return <div><input name="legalLinksJson" type="hidden" value={JSON.stringify(serialized)} /><div className="space-y-2">{items.map((item, index) => <div className="grid items-start gap-2 sm:grid-cols-[1fr_auto]" key={item.key}><DestinationSelect defaultValue={item.href ? destinationFromHref(item.href, item.label) : null} label={`Page ${index + 1}`} onChange={(destination) => setItems((current) => current.map((link) => link.key === item.key ? { ...link, label: destination?.label ?? "", href: destination?.href ?? "" } : link))} required /><button aria-label="Remove footer link" className="mt-6 grid size-9 place-items-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={() => setItems((current) => current.filter((link) => link.key !== item.key))} type="button"><Trash2 size={13} /></button></div>)}</div><button className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold" onClick={() => setItems((current) => [...current, { key: `footer-${Date.now()}`, label: "", href: "" }])} type="button"><Plus size={13} />Add footer page</button></div>;
}
