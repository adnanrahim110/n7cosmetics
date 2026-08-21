import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  pathname: string;
  query?: Record<string, string | undefined>;
}

export function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function Pagination({ page, pageSize, totalItems, pathname, query = {} }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pageNumbers = Array.from(
    new Set([1, page - 1, page, page + 1, totalPages].filter((value) => value >= 1 && value <= totalPages)),
  );
  const href = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    if (targetPage > 1) params.set("page", String(targetPage));
    const serialized = params.toString();
    return serialized ? `${pathname}?${serialized}` : pathname;
  };
  const buttonClass = "inline-flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition";

  return (
    <nav aria-label="Table pagination" className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">Showing {start}–{end} of {totalItems}</p>
      <div className="flex items-center gap-1">
        <Link aria-disabled={page === 1} aria-label="Previous page" className={`${buttonClass} ${page === 1 ? "pointer-events-none border-zinc-200 text-zinc-300" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"}`} href={href(Math.max(1, page - 1))}><ChevronLeft size={15} /></Link>
        {pageNumbers.map((pageNumber, index) => {
          const previous = pageNumbers[index - 1];
          return (
            <span className="contents" key={pageNumber}>
              {previous && pageNumber - previous > 1 ? <span aria-hidden="true" className="px-1 text-zinc-400">…</span> : null}
              <Link aria-current={pageNumber === page ? "page" : undefined} aria-label={`Page ${pageNumber}`} className={`${buttonClass} ${pageNumber === page ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"}`} href={href(pageNumber)}>{pageNumber}</Link>
            </span>
          );
        })}
        <Link aria-disabled={page === totalPages} aria-label="Next page" className={`${buttonClass} ${page === totalPages ? "pointer-events-none border-zinc-200 text-zinc-300" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"}`} href={href(Math.min(totalPages, page + 1))}><ChevronRight size={15} /></Link>
      </div>
    </nav>
  );
}
