import { Trash2 } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import type { ReviewContent } from "@/lib/homepage/types";

interface ReviewEditorItemProps {
  review: ReviewContent;
  index: number;
  onChange: (patch: Partial<ReviewContent>) => void;
  onRemove: () => void;
}

const input = "min-h-11 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-normal leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 motion-reduce:transition-none";
const label = "grid min-w-0 gap-1 text-xs font-medium text-zinc-700";

export default function ReviewEditorItem({ review, index, onChange, onRemove }: ReviewEditorItemProps) {
  const id = useId();

  return (
    <fieldset className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
      <legend className="sr-only">Review {index + 1}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className={label} htmlFor={`${id}-author`}>
            Author
            <input className={input} id={`${id}-author`} maxLength={120} onChange={(event) => onChange({ author: event.target.value })} required value={review.author} />
          </label>
          <label className={label} htmlFor={`${id}-product`}>
            Product (optional)
            <input className={input} id={`${id}-product`} maxLength={120} onChange={(event) => onChange({ product: event.target.value })} placeholder="e.g. Aventus" value={review.product ?? ""} />
          </label>
          <label className={cn(label, "sm:col-span-2")} htmlFor={`${id}-text`}>
            Review
            <textarea className={input} id={`${id}-text`} maxLength={1000} onChange={(event) => onChange({ text: event.target.value })} required rows={2} value={review.text} />
          </label>
        </div>
        <button aria-label={`Remove review ${index + 1}`} className="grid size-11 place-items-center rounded-md border border-red-200 bg-white text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 motion-reduce:transition-none" onClick={onRemove} type="button">
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </div>
    </fieldset>
  );
}
