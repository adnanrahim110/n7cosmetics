"use client";

import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { NavigationItem } from "@/content/global";
import { destinationFromHref } from "@/lib/admin/destination";
import CustomSelect from "./CustomSelect";
import DestinationSelect from "./DestinationSelect";
import MediaDropzone from "./MediaDropzone";

interface EditableSubItem {
  key: string;
  name: string;
  href: string;
  image: string;
}

interface EditableItem {
  key: string;
  label: string;
  href: string;
  type: "link" | "mega" | "dropdown";
  items: EditableSubItem[];
}

const iconButton = "grid size-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35";

const typeLabels: Record<EditableItem["type"], string> = {
  link: "Simple link",
  mega: "Mega menu",
  dropdown: "Dropdown",
};

function normalize(items: NavigationItem[]): EditableItem[] {
  return items.map((item, index) => ({
    key: `existing-${index}-${item.label}`,
    label: item.label,
    href: item.href,
    type: item.type ?? "link",
    items: item.items?.map((sub, subIndex) => ({
      key: `existing-${index}-${subIndex}-${sub.name}`,
      name: sub.name,
      href: sub.href,
      image: sub.image ?? "",
    })) ?? [],
  }));
}

export default function NavigationEditor({ defaultItems }: { defaultItems: NavigationItem[] }) {
  const [items, setItems] = useState<EditableItem[]>(() => normalize(defaultItems));
  const [expanded, setExpanded] = useState<string | null>(null);

  function update(index: number, values: Partial<EditableItem>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  }

  function move(index: number, direction: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateSub(itemIndex: number, subIndex: number, values: Partial<EditableSubItem>) {
    setItems((current) => current.map((item, index) => index === itemIndex ? {
      ...item,
      items: item.items.map((sub, index2) => index2 === subIndex ? { ...sub, ...values } : sub),
    } : item));
  }

  function addItem() {
    const key = `nav-${Date.now()}`;
    setItems((current) => [...current, { key, label: "", href: "", type: "link", items: [] }]);
    setExpanded(key);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div><p className="text-[13px] font-medium text-zinc-700">Navigation links</p><p className="text-[11px] text-zinc-400">Select a page or product; its name and URL are applied automatically.</p></div>
        <button className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50" onClick={addItem} type="button"><Plus size={13} />Add link</button>
      </div>
      <input name="navigationJson" type="hidden" value={JSON.stringify(items)} />
      <div className="space-y-2">
        {items.map((item, index) => {
          const isExpanded = expanded === item.key;
          return (
            <article className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/60" key={item.key}>
              <div className="flex min-h-11 items-center gap-1.5 p-1.5">
                <button aria-expanded={isExpanded} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white" onClick={() => setExpanded(isExpanded ? null : item.key)} type="button">
                  <span className="grid size-5 shrink-0 place-items-center rounded bg-zinc-200 text-[10px] font-semibold text-zinc-600">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">{item.label || "Untitled link"}</span>
                  <span className="hidden rounded bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200 sm:block">{typeLabels[item.type]}</span>
                  <ChevronDown className={`shrink-0 text-zinc-400 transition ${isExpanded ? "rotate-180" : ""}`} size={15} />
                </button>
                <button aria-label="Move link up" className={iconButton} disabled={index === 0} onClick={() => move(index, -1)} type="button"><ArrowUp size={13} /></button>
                <button aria-label="Move link down" className={iconButton} disabled={index === items.length - 1} onClick={() => move(index, 1)} type="button"><ArrowDown size={13} /></button>
                <button aria-label="Remove link" className={`${iconButton} border-red-200 text-red-600 hover:bg-red-50`} onClick={() => { setItems((current) => current.filter((_, itemIndex) => itemIndex !== index)); if (isExpanded) setExpanded(null); }} type="button"><Trash2 size={13} /></button>
              </div>

              {isExpanded ? (
                <div className="border-t border-zinc-200 bg-white p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <DestinationSelect defaultValue={item.href ? destinationFromHref(item.href, item.label) : null} label="Page" onChange={(destination) => update(index, { label: destination?.label ?? "", href: destination?.href ?? "" })} required />
                    <CustomSelect defaultValue={item.type} label="Link type" name={`navigationType${index}`} onChange={(values) => update(index, { type: (values[0] ?? "link") as EditableItem["type"] })} options={[{ value: "link", label: "Simple link" }, { value: "mega", label: "Mega menu" }, { value: "dropdown", label: "Dropdown" }]} searchable={false} />
                  </div>

                  {item.type !== "link" ? (
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Menu items</p><button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold" onClick={() => update(index, { items: [...item.items, { key: `sub-${Date.now()}`, name: "", href: "", image: "" }] })} type="button"><Plus size={12} />Add item</button></div>
                      <div className="grid gap-2 lg:grid-cols-2">
                        {item.items.map((sub, subIndex) => (
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5" key={sub.key}>
                            <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold text-zinc-500">Item {subIndex + 1}</p><button aria-label="Remove menu item" className="grid size-7 place-items-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={() => update(index, { items: item.items.filter((_, subItemIndex) => subItemIndex !== subIndex) })} type="button"><Trash2 size={12} /></button></div>
                            <DestinationSelect defaultValue={sub.href ? destinationFromHref(sub.href, sub.name) : null} label="Page" onChange={(destination) => updateSub(index, subIndex, { name: destination?.label ?? "", href: destination?.href ?? "" })} required />
                            <MediaDropzone accept="image" className="mt-2" defaultAssets={sub.image ? [{ url: sub.image, type: "image", name: sub.name }] : []} label="Menu thumbnail" name={`navigationThumbnail${index}-${subIndex}`} onChange={(assets) => updateSub(index, subIndex, { image: assets[0]?.url ?? "" })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
