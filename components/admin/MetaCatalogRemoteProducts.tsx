"use client";
import { useState } from "react";
import type { CatalogRemoteItem } from "@/lib/meta/catalog-remote-status";
import { formatMetaAdminTime } from "@/lib/meta/admin-time";
import { cn } from "@/lib/cn";

const images = { READY: "Ready", PENDING: "Awaiting image fetch", FAILED: "Missing / invalid image", UNKNOWN: "Not reported" };
const eligibility = { ELIGIBLE: "Eligible", BLOCKED: "Issues reported", PENDING: "Awaiting confirmation", UNKNOWN: "Not reported" };
const reviews: Record<string, string> = { APPROVED: "Approved", REJECTED: "Rejected", PENDING: "Pending", OUTDATED: "Review outdated", NO_REVIEW: "No review reported" };
const tones = { ELIGIBLE: "bg-emerald-50 text-emerald-800", BLOCKED: "bg-red-50 text-red-800", PENDING: "bg-blue-50 text-blue-800", UNKNOWN: "bg-zinc-100 text-zinc-700" };
const pageSize = 10;

export default function MetaCatalogRemoteProducts({ items }: { items: CatalogRemoteItem[] }) {
  const [filter, setFilter] = useState({ query: "", page: 0 });
  const query = filter.query.trim().toLowerCase();
  const matching = items.filter(item => !query || `${item.name} ${item.id}`.toLowerCase().includes(query));
  const lastPage = Math.max(0, Math.ceil(matching.length / pageSize) - 1), page = Math.min(filter.page, lastPage);
  const visible = matching.slice(page * pageSize, (page + 1) * pageSize);
  if (!items.length) return <p className="text-sm text-zinc-500">No website items are ready for catalogue checks yet.</p>;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="w-full sm:w-72"><label htmlFor="meta-catalog-status-search" className="mb-1 block text-xs font-medium text-zinc-700">Find a product or code</label><input id="meta-catalog-status-search" type="search" value={filter.query} onChange={event => setFilter({ query: event.target.value, page: 0 })} className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" /></div>
      <p className="text-xs text-zinc-500" aria-live="polite">{matching.length ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, matching.length)} of ${matching.length} products` : "No matching products"}</p>
    </div>
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full min-w-192 text-left text-xs">
        <caption className="sr-only">Product image, ad review and eligibility results returned by Meta</caption>
        <thead className="bg-zinc-50 text-zinc-600"><tr>{["Product", "Image", "Ad review", "Eligibility / issues", "Details"].map(label => <th key={label} scope="col" className="p-3 font-medium">{label}</th>)}</tr></thead>
        <tbody>{visible.map(item => <tr key={item.id} className="border-t border-zinc-100">
          <td className="p-3 align-top"><p className="font-medium text-zinc-900">{item.name}</p><p className="mt-1 text-zinc-500">{item.id}</p></td>
          <td className="p-3 align-top"><p>{images[item.image]}</p>{item.imageStatus ? <p className="mt-1 text-zinc-500">{item.imageStatus}</p> : null}</td>
          <td className="p-3 align-top">{item.adReview ? reviews[item.adReview] ?? "Not reported" : "Not reported"}</td>
          <td className="p-3 align-top"><span className={cn("inline-block rounded-full px-2 py-1 font-medium", tones[item.eligibility])}>{eligibility[item.eligibility]}</span>{item.stale ? <p className="mt-1 text-amber-800">Awaiting a fresh check</p> : null}</td>
          <td className="w-80 p-3 align-top"><div className="space-y-2">{item.issues.map((issue, index) => <details key={`${issue.code}:${index}`}><summary className="flex min-h-11 cursor-pointer items-center font-medium text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">{issue.title}</summary><p className="mt-1 leading-5 text-zinc-600">{issue.message}</p></details>)}</div>{!item.issues.length ? <p className="leading-5 text-zinc-500">{!item.checkedAt || item.stale ? "Awaiting current Meta results." : item.eligibility === "UNKNOWN" ? "Meta has not explicitly reported ad approval." : item.eligibility === "PENDING" ? "Meta has not completed all image / ad checks." : "No product issues returned by Meta."}</p> : null}<p className="mt-2 text-zinc-500">Checked: {formatMetaAdminTime(item.checkedAt)}</p></td>
        </tr>)}</tbody>
      </table>
      {!visible.length ? <p role="status" className="p-4 text-sm text-zinc-500">No products match this search.</p> : null}
    </div>
    {matching.length > pageSize ? <nav aria-label="Meta product status pages" className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={page === 0} onClick={() => setFilter(current => ({ ...current, page: page - 1 }))} className="min-h-11 rounded-lg border border-zinc-300 px-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span>Page {page + 1} of {lastPage + 1}</span><button type="button" disabled={page === lastPage} onClick={() => setFilter(current => ({ ...current, page: page + 1 }))} className="min-h-11 rounded-lg border border-zinc-300 px-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></nav> : null}
  </div>;
}
