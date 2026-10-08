"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { destinationFromHref } from "@/lib/admin/destination";
import type { FooterLink } from "@/lib/homepage/types";
import DestinationSelect from "./DestinationSelect";

export { default as ReviewsEditor } from "./ReviewsEditor";

export function FooterLinksEditor({ defaultItems }: { defaultItems: FooterLink[] }) {
  const [items, setItems] = useState(() => defaultItems.map((item, index) => ({ ...item, key: `footer-${index}-${item.href}` })));
  const serialized = items.map(({ label, href }) => ({ label, href }));
  return <div><input name="legalLinksJson" type="hidden" value={JSON.stringify(serialized)} /><div className="space-y-2">{items.map((item, index) => <div className="grid items-start gap-2 sm:grid-cols-[1fr_auto]" key={item.key}><DestinationSelect defaultValue={item.href ? destinationFromHref(item.href, item.label) : null} label={`Page ${index + 1}`} onChange={(destination) => setItems((current) => current.map((link) => link.key === item.key ? { ...link, label: destination?.label ?? "", href: destination?.href ?? "" } : link))} required /><button aria-label="Remove footer link" className="mt-6 grid size-9 place-items-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={() => setItems((current) => current.filter((link) => link.key !== item.key))} type="button"><Trash2 size={13} /></button></div>)}</div><button className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold" onClick={() => setItems((current) => [...current, { key: `footer-${Date.now()}`, label: "", href: "" }])} type="button"><Plus size={13} />Add footer page</button></div>;
}
