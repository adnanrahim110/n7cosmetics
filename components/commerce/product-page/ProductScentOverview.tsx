import ScentNotesCard from "@/components/commerce/ScentNotesCard";
import ScentProfileCard, {
  getScentProfileRows,
} from "@/components/commerce/ScentProfileCard";
import { cn } from "@/lib/cn";
import type { StorefrontProduct } from "@/lib/commerce/catalog";
import scentDiscoveryImage from "@/public/imgs/fragrance/scent-discovery.webp";
import Image from "next/image";

export default function ProductScentOverview({
  product,
}: {
  product: StorefrontProduct;
}) {
  const noteGroups = [
    { label: "Opening", caption: "Top notes", notes: product.noteGroups.top },
    {
      label: "The heart",
      caption: "Heart notes",
      notes: product.noteGroups.heart,
    },
    {
      label: "The trail",
      caption: "Base notes",
      notes: product.noteGroups.base,
    },
  ]
    .map((group) => ({
      ...group,
      notes: [
        ...new Set(group.notes.map((note) => note.trim()).filter(Boolean)),
      ],
    }))
    .filter((group) => group.notes.length);
  const hasProfile = getScentProfileRows(product.scentProfile).length > 0;

  if (!noteGroups.length && !hasProfile) return null;

  return (
    <section
      aria-label="Explore the scent"
      className="mx-auto mt-8 max-w-7xl px-4 sm:px-8"
    >
      <div
        className={cn(
          "grid items-stretch gap-4",
          noteGroups.length > 0 && hasProfile && "lg:grid-cols-2",
        )}
      >
        <ScentNotesCard groups={noteGroups} />
        {hasProfile ? (
          <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] rounded-sm border border-[#967c55]/25 bg-white/35 overflow-hidden">
            <ScentProfileCard
              profile={product.scentProfile}
              className="mt-0 h-full rounded-sm p-6"
            />
            <figure className="relative min-h-64 overflow-hidden">
              <Image
                src={scentDiscoveryImage}
                alt="A person sampling a fragrance with a perfume testing strip"
                fill
                placeholder="blur"
                className="object-cover"
                sizes={
                  noteGroups.length
                    ? "(min-width: 1280px) 272px, (min-width: 1024px) 22vw, (min-width: 640px) 44vw, 100vw"
                    : "(min-width: 1280px) 552px, (min-width: 640px) 44vw, 100vw"
                }
              />
            </figure>
          </div>
        ) : null}
      </div>
    </section>
  );
}
