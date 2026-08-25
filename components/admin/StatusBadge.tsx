const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DRAFT: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  ARCHIVED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  HIDDEN: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  NEW: "bg-blue-50 text-blue-700 ring-blue-200",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200",
  PROCESSING: "bg-amber-50 text-amber-700 ring-amber-200",
  SHIPPED: "bg-violet-50 text-violet-700 ring-violet-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200";
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>{status.toLowerCase().replaceAll("_", " ")}</span>;
}
