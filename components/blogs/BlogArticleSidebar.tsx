import { ArrowDownRight, ArrowUpRight, List } from "lucide-react";
import Link from "next/link";
import type { BlogArticleHeading } from "@/lib/blogs/article-navigation";
import { cn } from "@/lib/cn";

const linkClass = "flex min-h-11 items-center gap-3 rounded-sm py-2 text-sm font-medium text-dark-900 underline-offset-4 wrap-anywhere hover:text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800";

export default function BlogArticleSidebar({
  headings,
  hasRelatedPosts,
}: {
  headings: BlogArticleHeading[];
  hasRelatedPosts: boolean;
}) {
  return (
    <aside aria-label="Article navigation" className="min-w-0 space-y-4">
      {headings.length > 0 ? (
        <nav aria-labelledby="blog-contents-title" className="border border-primary-200 bg-primary-50 p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-3 border-b border-primary-300 pb-4">
            <h2 className="font-heading text-2xl leading-tight text-dark-950" id="blog-contents-title">On this page</h2>
            <List aria-hidden="true" className="size-5 shrink-0 text-primary-800" />
          </div>
          <ol className="divide-y divide-primary-200" role="list">
            {headings.map(({ id, label, level }, index) => (
              <li className={cn(level === 3 && "pl-4")} key={id}>
                <a className={linkClass} href={`#${id}`}>
                  <span aria-hidden="true" className="shrink-0 font-semibold text-primary-800 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">{label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <nav aria-labelledby="blog-discover-title" className="border border-primary-300 bg-primary-200/55 p-5 sm:p-6">
        <p className="mb-2 text-xs font-semibold tracking-widest text-primary-800 uppercase">N7 Journal</p>
        <h2 className="font-heading text-2xl leading-tight text-dark-950" id="blog-discover-title">Keep exploring</h2>
        <p className="mt-2 text-sm leading-relaxed text-dark-800">Fragrance guides, scent notes, and stories from N7.</p>
        <div className="mt-4 divide-y divide-primary-300 border-t border-primary-300">
          {hasRelatedPosts ? (
            <a className={cn(linkClass, "justify-between")} href="#related-blogs">
              Related posts <ArrowDownRight aria-hidden="true" className="size-4 shrink-0" />
            </a>
          ) : null}
          <Link className={cn(linkClass, "justify-between")} href="/blogs">
            All blog posts <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </div>
      </nav>
    </aside>
  );
}
