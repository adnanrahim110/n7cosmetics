import { cn } from "@/lib/cn";

export interface MetaCatalogMetricProps {
  label: string;
  value: number;
  tone: "neutral" | "success" | "processing" | "error";
}
const colors = { neutral: "text-zinc-950", success: "text-emerald-700", processing: "text-blue-700", error: "text-red-700" };

export default function MetaCatalogMetricCard({ label, value, tone }: MetaCatalogMetricProps) {
  return <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs text-zinc-600">{label}</p><p className={cn("mt-2 text-2xl font-semibold tabular-nums", colors[tone])}>{value}</p></div>;
}
