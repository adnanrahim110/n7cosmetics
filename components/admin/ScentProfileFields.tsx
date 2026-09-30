import CustomSelect from "@/components/admin/CustomSelect";
import { readScentProfile } from "@/lib/commerce/scent-profile";

export default function ScentProfileFields({ value }: { value: unknown }) {
  const profile = readScentProfile(value);
  const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-amber-700";
  return <div className="space-y-4 border-t border-zinc-100 pt-5">
    <p className="text-sm font-medium text-zinc-800">Scent decision card</p>
    <p className="text-xs text-zinc-500">Optional. Separate descriptors with commas. Empty fields stay hidden in the store.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {([
        ["families", "Scent families", "Fresh, Citrus, Woody"],
        ["moods", "Mood", "Clean, Confident"],
        ["occasions", "Occasions", "Everyday, Office"],
        ["seasons", "Seasons", "Spring, Summer"],
      ] as const).map(([key, label, placeholder]) => <label key={key} className="text-sm font-medium text-zinc-700">{label}<input className={input} name={`scent.${key}`} defaultValue={profile[key].join(", ")} maxLength={500} placeholder={placeholder} /></label>)}
      {(["intensity", "projection"] as const).map(key => <CustomSelect key={key} label={key === "intensity" ? "Intensity" : "Projection"} name={`scent.${key}`} defaultValue={String(profile[key] ?? "")} options={[{value: "", label: "Not specified"}, ...[1, 2, 3, 4, 5].map(level => ({value: String(level), label: `${level} / 5`}))]} searchable={false} />)}
      <label className="text-sm font-medium text-zinc-700">Longevity<input className={input} name="scent.longevity" defaultValue={profile.longevity} maxLength={150} placeholder="Only a tested or surveyed range" /></label>
      <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Performance source<textarea className={input} name="scent.evidence" defaultValue={profile.evidence} maxLength={500} rows={3} placeholder="Describe the test or survey, date and conditions. Displayed to customers." /><span className="mt-1 block text-xs font-normal text-zinc-500">Required when publishing intensity, projection or longevity. Do not include private information.</span></label>
    </div>
  </div>;
}
