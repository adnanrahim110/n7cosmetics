import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";
import { pageMetadata } from "@/lib/metadata";
import { collectionPageHref, collectionPageNumber, collectionPagination } from "@/lib/commerce/collection-pagination";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";

interface RecreationsPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

const loadCollection = cache(() => getCollectionPage("recreations"));

export async function generateMetadata({ searchParams }: RecreationsPageProps): Promise<Metadata> {
  const [collection, query] = await Promise.all([loadCollection(), searchParams]);
  const pagination = collectionPagination(collection.products.length, collectionPageNumber(query.page));
  return pageMetadata({
    path: collectionPageHref("/recreations", pagination.page),
    title: pagination.page === 1
      ? "Fragrance Recreations | N7 Cosmetics"
      : `Fragrance Recreations – Page ${pagination.page} | N7 Cosmetics`,
    description: "Discover the Yusuf Bhai recreation collection: independent interpretations of celebrated fragrance profiles for him, her and everyone.",
    image: {
      url: "/imgs/products/5.png",
      alt: "Yusuf Bhai recreation fragrance bottle with a black cap and gold collar",
      width: 1024,
      height: 1536,
    },
  });
}

export default async function RecreationsPage({ searchParams }: RecreationsPageProps) {
  const [collection, query] = await Promise.all([loadCollection(), searchParams]);
  const requestedPage = collectionPageNumber(query.page);
  const pagination = collectionPagination(collection.products.length, requestedPage);
  if (requestedPage !== pagination.page) redirect(collectionPageHref("/recreations", pagination.page));
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero content={collection} design={design} />
      <CollectionCatalog collection={collection} design={design} pagination={pagination} />
    </>
  );
}
