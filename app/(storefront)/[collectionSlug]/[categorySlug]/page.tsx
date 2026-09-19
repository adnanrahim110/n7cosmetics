import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import CollectionCatalog from "@/components/collections/CollectionCatalog";
import CollectionHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCategoryPage } from "@/lib/commerce/collections";
import { categoryHref } from "@/lib/commerce/category-config";

type PageProps = { params: Promise<{ collectionSlug: string; categorySlug: string }> };
const loadPage = cache(getCategoryPage);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collectionSlug, categorySlug } = await params;
  const page = await loadPage(collectionSlug, categorySlug);
  if (!page) notFound();
  return {
    title: page.category.seo_title || `${page.category.name} | ${page.category.collection_name} | N7 Cosmetics`,
    description: page.category.seo_description || page.category.description || page.collection.intro || undefined,
    alternates: { canonical: categoryHref(collectionSlug, categorySlug) },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { collectionSlug, categorySlug } = await params;
  const page = await loadPage(collectionSlug, categorySlug);
  if (!page) notFound();
  const design = collectionDesigns[page.collection.slug];
  return (
    <>
      <CollectionHero content={page.collection} design={design} />
      <nav aria-label="Breadcrumb" className="bg-[#f3eee5] px-5 pt-8 text-xs text-[#6f5738] sm:px-8 lg:px-12">
        <ol className="mx-auto flex max-w-336 flex-wrap items-center gap-3">
          <li><Link className="underline-offset-4 hover:underline" href={`/${collectionSlug}`}>{page.category.collection_name}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{page.category.name}</li>
        </ol>
      </nav>
      <CollectionCatalog collection={page.collection} design={design} />
    </>
  );
}
