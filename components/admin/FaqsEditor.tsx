"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { faqLimits } from "@/lib/homepage/faqs";
import type { FaqContent } from "@/lib/homepage/types";
import FaqEditorItem from "./FaqEditorItem";

interface EditorFaqContent extends FaqContent {
  key: number;
}

export default function FaqsEditor({ defaultItems }: { defaultItems: FaqContent[] }) {
  const [items, setItems] = useState<EditorFaqContent[]>(() => defaultItems.map((item, key) => ({ ...item, key })));
  const [announcement, setAnnouncement] = useState("");
  const nextKey = useRef(defaultItems.length);
  const { pending } = useFormStatus();
  const serialized = items.map(({ question, answer }) => ({ question, answer }));

  function moveItem(key: number, direction: -1 | 1) {
    const index = items.findIndex((item) => item.key === key);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= items.length) return;
    const reordered = [...items];
    const [item] = reordered.splice(index, 1);
    reordered.splice(destination, 0, item);
    setItems(reordered);
    setAnnouncement(`FAQ moved to position ${destination + 1}.`);
  }

  function addItem() {
    if (pending || items.length >= faqLimits.items) return;
    const key = nextKey.current++;
    setItems((current) => [...current, { question: "", answer: "", key }]);
    setAnnouncement(`FAQ ${items.length + 1} added.`);
  }

  return (
    <div className="min-w-0">
      <input name="faqsJson" type="hidden" value={JSON.stringify(serialized)} />
      <p className="mb-4 text-sm leading-6 text-zinc-600">Add up to {faqLimits.items} FAQs. Use the arrows to set their storefront order. Remove every FAQ and save to hide this section.</p>
      <div className="space-y-4">
        {items.length ? items.map((item, index) => (
          <FaqEditorItem
            count={items.length}
            disabled={pending}
            index={index}
            item={item}
            key={item.key}
            onChange={(patch) => setItems((current) => current.map((entry) => entry.key === item.key ? { ...entry, ...patch } : entry))}
            onMove={(direction) => moveItem(item.key, direction)}
            onRemove={() => {
              setItems((current) => current.filter((entry) => entry.key !== item.key));
              setAnnouncement(`FAQ ${index + 1} removed.`);
            }}
          />
        )) : (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">No FAQs yet. Add a question to show the section, or save this empty list to hide it.</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-3 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          disabled={pending || items.length >= faqLimits.items}
          onClick={addItem}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />Add FAQ
        </button>
        <span className="text-xs text-zinc-600">{items.length} / {faqLimits.items} FAQs</span>
      </div>
      <p aria-live="polite" className="sr-only">{announcement}</p>
    </div>
  );
}
