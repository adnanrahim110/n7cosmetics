import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Title from "@/components/ui/Title";
import type { CollectionPageContent } from "../../content/collections";
import type { CollectionDesign } from "./collection-config";

export default function CollectionOutro({
  collection,
  design,
}: {
  collection: CollectionPageContent;
  design: CollectionDesign;
}) {
  return (
    <div className="mt-28 border-t border-black/14 pt-12 md:mt-36 md:pt-16">
      {collection.disclaimer && (
        <div className="mb-14 grid gap-6 border-b border-black/10 pb-10 md:grid-cols-[0.3fr_1fr]">
          <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-black/35">
            A note on recreations
          </span>
          <p className="max-w-4xl text-xs font-light leading-6 text-black/46">
            {collection.disclaimer}
          </p>
        </div>
      )}

      <Link href={design.nextHref} className="group/next block">
        <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.28em] text-black/36">
          <span>Continue your discovery</span>
          <span>Next collection</span>
        </div>
        <div className="mt-7 flex items-end justify-between gap-6 border-b border-black/16 pb-7 transition-colors duration-500 group-hover/next:border-black/48">
          <Title className="max-w-5xl uppercase" text={design.nextLabel} tone="ink" />
          <span className="flex size-13 shrink-0 items-center justify-center rounded-full border border-black/20 text-black transition-all duration-500 group-hover/next:-rotate-45 group-hover/next:border-black group-hover/next:bg-black group-hover/next:text-white sm:size-16">
            <ArrowRight className="size-5" />
          </span>
        </div>
      </Link>
    </div>
  );
}
