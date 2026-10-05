import { cn } from "@/lib/cn";
import type { ScentProfile } from "@/lib/commerce/scent-profile";

export function getScentProfileRows(profile: ScentProfile) {
  const rows: Array<[label: string, value: string]> = [
    ["Scent family", profile.families.join(" · ")],
    ["Mood", profile.moods.join(" · ")],
    ["Best for", profile.occasions.join(" · ")],
    ["Season", profile.seasons.join(" · ")],
    [
      "Intensity",
      profile.evidence && profile.intensity ? `${profile.intensity} / 5` : "",
    ],
    [
      "Projection",
      profile.evidence && profile.projection ? `${profile.projection} / 5` : "",
    ],
    ["Longevity", profile.evidence ? profile.longevity : ""],
  ];
  return rows.filter(([, value]) => value);
}

export default function ScentProfileCard({
  profile,
  className,
}: {
  profile: ScentProfile;
  className?: string;
}) {
  const rows = getScentProfileRows(profile);
  if (!rows.length) return null;
  return (
    <section
      aria-label="Scent profile"
      className={cn(
        "mt-6 min-w-0 p-5",
        className,
      )}
    >
      <h2 className="font-body text-xs font-semibold uppercase tracking-[0.16em]">
        Is this your scent?
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3"
          >
            <dt className="text-stone-600">{label}</dt>
            <dd className="text-stone-900 wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
      {profile.evidence &&
      (profile.intensity || profile.projection || profile.longevity) ? (
        <p className="mt-4 text-xs leading-5 text-stone-600 wrap-anywhere">
          Performance source: {profile.evidence}
        </p>
      ) : null}
    </section>
  );
}
