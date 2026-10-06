import { cn } from "@/lib/cn";
export default function MetaActionFeedback({ state }: { state: { error?: string; success?: string } }) {
  if (!state.error && !state.success) return null;
  return <p role={state.error ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", state.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{state.error || state.success}</p>;
}
