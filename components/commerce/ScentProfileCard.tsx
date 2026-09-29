import type { ScentProfile } from "@/lib/commerce/scent-profile";

export default function ScentProfileCard({ profile }: { profile: ScentProfile }) {
  const rows = [
    ["Scent family", profile.families.join(" · ")],
    ["Mood", profile.moods.join(" · ")],
    ["Best for", profile.occasions.join(" · ")],
    ["Season", profile.seasons.join(" · ")],
    ["Intensity", profile.evidence && profile.intensity ? `${profile.intensity} / 5` : ""],
    ["Projection", profile.evidence && profile.projection ? `${profile.projection} / 5` : ""],
    ["Longevity", profile.evidence ? profile.longevity : ""],
  ].filter(([, value]) => value);
  if (!rows.length) return null;
  return <section aria-label="Scent profile" className="mt-6 border border-[#967c55]/25 bg-white/35 p-5">
    <h2 className="font-body text-xs font-semibold uppercase tracking-[0.16em]">Is this your scent?</h2>
    <dl className="mt-4 space-y-3 text-sm">
      {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3"><dt className="text-black/50">{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {profile.evidence && (profile.intensity || profile.projection || profile.longevity) ? <p className="mt-4 text-xs leading-5 text-black/55">Performance source: {profile.evidence}</p> : null}
  </section>;
}
