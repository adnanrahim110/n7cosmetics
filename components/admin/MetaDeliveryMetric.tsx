import { cn } from "@/lib/cn";

export default function MetaDeliveryMetric({ label, value, detail, healthy }: { label: string; value: string; detail: string; healthy?: boolean }) {
  return <div><dt className="text-zinc-500">{label}</dt><dd className={cn("mt-1 font-medium", healthy === undefined ? "text-zinc-950" : healthy ? "text-emerald-800" : "text-amber-800")}>{value}</dd><dd className="mt-1 text-xs text-zinc-500">{detail}</dd></div>;
}
