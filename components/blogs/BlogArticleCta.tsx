import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BlogArticleCta() {
  return (
    <aside
      aria-labelledby="blog-collection-title"
      className="mt-12 grid items-center gap-6 border-t-2 border-primary-500 bg-dark-950 px-5 py-8 sm:mt-16 sm:px-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_auto] lg:px-12"
    >
      <div className="min-w-0 space-y-3">
        <p className="text-xs font-semibold tracking-widest text-primary-300 uppercase">The N7 Collection</p>
        <h2 className="font-heading text-3xl leading-tight text-primary-50 sm:text-4xl" id="blog-collection-title">
          Find a scent to make your own
        </h2>
        <p className="max-w-lg leading-relaxed text-primary-100/80">Discover the signature fragrances from N7 Cosmetics.</p>
      </div>
      <Link
        className="inline-flex min-h-12 items-center justify-center gap-3 bg-primary-400 px-5 py-3 text-sm font-semibold text-dark-950 hover:bg-primary-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-300 sm:justify-self-start md:justify-self-end"
        href="/n7"
      >
        Explore the N7 Collection
        <ArrowRight aria-hidden="true" className="shrink-0" size={18} />
      </Link>
    </aside>
  );
}
