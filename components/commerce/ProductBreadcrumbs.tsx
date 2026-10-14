import { productBreadcrumbs, type BreadcrumbProduct } from "@/lib/commerce/breadcrumbs";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export default function ProductBreadcrumbs({ product }: { product: BreadcrumbProduct }) {
  const items = productBreadcrumbs(product);
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-xs text-stone-600">
      {items.map((item, index) => (
        <Fragment key={item.href}>
          {index > 0 ? <ChevronRight aria-hidden="true" size={12} /> : null}
          {index === items.length - 1 ? (
            <span aria-current="page" className="min-w-0 text-stone-900 wrap-anywhere">{item.name}</span>
          ) : (
            <Link
              className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 transition-colors hover:text-stone-950 hover:underline active:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-700 motion-reduce:transition-none"
              href={item.href}
            >
              {item.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
