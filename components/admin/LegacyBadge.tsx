import Link from "next/link";

export default function LegacyBadge({ source, importId }: { source?: string; importId?: string | number | null }) {
  if (source !== "LEGACY") return null;
  const style = "inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800";
  return importId ? <Link className={style} href={`/admin/imports/${importId}`}>Historical</Link> : <span className={style}>Historical</span>;
}
