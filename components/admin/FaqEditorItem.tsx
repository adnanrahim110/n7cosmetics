import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { faqLimits } from "@/lib/homepage/faqs";
import type { FaqContent } from "@/lib/homepage/types";

interface FaqEditorItemProps {
  item: FaqContent;
  index: number;
  count: number;
  disabled: boolean;
  onChange: (patch: Partial<FaqContent>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const input = "mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 focus-visible:ring-2 focus-visible:ring-amber-700 disabled:opacity-60";

export default function FaqEditorItem({ item, index, count, disabled, onChange, onMove, onRemove }: FaqEditorItemProps) {
  const actions = [
    { key: "up", label: `Move FAQ ${index + 1} up`, Icon: ArrowUp, onClick: () => onMove(-1), disabled: disabled || index === 0, danger: false },
    { key: "down", label: `Move FAQ ${index + 1} down`, Icon: ArrowDown, onClick: () => onMove(1), disabled: disabled || index === count - 1, danger: false },
    { key: "remove", label: `Remove FAQ ${index + 1}`, Icon: Trash2, onClick: onRemove, disabled, danger: true },
  ];
  return (
    <fieldset className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4" disabled={disabled}>
      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">FAQ {index + 1}</legend>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-zinc-700">
          Question
          <input className={input} maxLength={faqLimits.question} onChange={(event) => onChange({ question: event.target.value })} required value={item.question} />
        </label>
        <label className="block text-sm font-medium text-zinc-700">
          Answer
          <textarea className={input} maxLength={faqLimits.answer} onChange={(event) => onChange({ answer: event.target.value })} required rows={4} value={item.answer} />
        </label>
        <div className="flex flex-wrap justify-end gap-2">
          {actions.map(({ key, label, Icon, onClick, disabled: actionDisabled, danger }) => (
            <button
              aria-label={label}
              className={cn(
                "grid size-11 place-items-center rounded-md border bg-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
                danger ? "border-red-200 text-red-700 hover:bg-red-50 active:bg-red-100" : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200",
              )}
              disabled={actionDisabled}
              key={key}
              onClick={onClick}
              type="button"
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
