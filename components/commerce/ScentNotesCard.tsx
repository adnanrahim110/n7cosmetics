import { cn } from "@/lib/cn";

interface ScentNoteGroup {
  label: string;
  caption: string;
  notes: string[];
}

export default function ScentNotesCard({
  groups,
  className,
}: {
  groups: ScentNoteGroup[];
  className?: string;
}) {
  if (!groups.length) return null;

  return (
    <section
      aria-label="Scent notes"
      className={cn(
        "min-w-0 rounded-sm border border-[#967c55]/25 bg-white/35 p-6",
        className,
      )}
    >
      <h2 className="font-body text-xs font-semibold uppercase tracking-[0.16em]">
        Scent notes
      </h2>
      <dl
        className={cn(
          "mt-6 grid gap-px overflow-hidden divide-x divide-[#967c55]/25 space-x-2",
          groups.length === 3 && "sm:grid-cols-3",
          groups.length === 2 && "sm:grid-cols-2",
        )}
      >
        {groups.map((group) => (
          <div className="min-w-0 not-last:pr-2" key={group.label}>
            <dt className="text-xs font-semibold text-[#8D6745]">
              {group.caption}
            </dt>
            <dd className="mt-3 text-sm leading-6 text-stone-700 wrap-anywhere">
              {group.notes.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
