"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { ReviewContent } from "@/lib/homepage/types";
import ReviewEditorItem from "./ReviewEditorItem";

export default function ReviewsEditor({ defaultItems }: { defaultItems: ReviewContent[] }) {
  const [items, setItems] = useState(() => defaultItems.map((review, index) => ({ ...review, key: `review-${index}` })));
  const nextKey = useRef(defaultItems.length);
  const serialized = items.map(({ author, text, product, rating }) => ({ author, text, product, rating }));

  function addReview() {
    const key = `review-${nextKey.current++}`;
    setItems((current) => current.length >= 12 ? current : [...current, { key, author: "", text: "", product: "" }]);
  }

  return (
    <div>
      <input name="reviewsJson" type="hidden" value={JSON.stringify(serialized)} />
      <div className="space-y-3">
        {items.map((review, index) => (
          <ReviewEditorItem
            index={index}
            key={review.key}
            onChange={(patch) => setItems((current) => current.map((item) => item.key === review.key ? { ...item, ...patch } : item))}
            onRemove={() => setItems((current) => current.filter((item) => item.key !== review.key))}
            review={review}
          />
        ))}
      </div>
      <button className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none" disabled={items.length >= 12} onClick={addReview} type="button">
        <Plus aria-hidden="true" size={16} />Add review
      </button>
    </div>
  );
}
