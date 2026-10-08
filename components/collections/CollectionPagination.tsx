import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { collectionPageHref, type CollectionPagination as Pagination } from "@/lib/commerce/collection-pagination";

export default function CollectionPagination({ pagination, pathname }: { pagination: Pagination; pathname: string }) {
  if (!pagination.totalCount) return null;
  const pages = [...new Set([
    1,
    pagination.totalPages,
    ...Array.from({ length: 5 }, (_, index) => pagination.page + index - 2),
  ])].filter(page => page >= 1 && page <= pagination.totalPages).sort((a, b) => a - b);
  const linkClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-stone-300 px-3 py-2 text-sm text-stone-700 transition-colors hover:border-stone-800 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700 motion-reduce:transition-none";
  const disabledClass = "inline-flex min-h-11 items-center justify-center rounded border border-stone-200 px-3 py-2 text-sm text-stone-500";

  return (
    <div className="mt-12 space-y-4 text-center">
      <p className="text-sm text-stone-600">
        Showing {pagination.offset + 1}–{pagination.end} of {pagination.totalCount} fragrances
      </p>
      {pagination.totalPages > 1 ? (
        <nav aria-label="Recreation collection pages" className="flex flex-wrap items-center justify-center gap-2">
          {pagination.page > 1 ? (
            <Link className={linkClass} href={`${collectionPageHref(pathname, pagination.page - 1)}#collection-index`} prefetch={false} rel="prev">Previous</Link>
          ) : <span aria-disabled="true" className={disabledClass}>Previous</span>}
          {pages.map((page, index) => (
            <Fragment key={page}>
              {index > 0 && page - pages[index - 1] > 1 ? <span aria-hidden="true" className="px-1 text-stone-500">…</span> : null}
              <Link
                aria-current={page === pagination.page ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={cn(linkClass, page === pagination.page && "border-stone-800 bg-stone-800 text-white hover:bg-stone-700")}
                href={`${collectionPageHref(pathname, page)}#collection-index`}
                prefetch={false}
              >
                {page}
              </Link>
            </Fragment>
          ))}
          {pagination.page < pagination.totalPages ? (
            <Link className={linkClass} href={`${collectionPageHref(pathname, pagination.page + 1)}#collection-index`} prefetch={false} rel="next">Next</Link>
          ) : <span aria-disabled="true" className={disabledClass}>Next</span>}
        </nav>
      ) : null}
    </div>
  );
}
