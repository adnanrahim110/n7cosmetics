import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Fragrance Bundles | N7 Cosmetics",
  description: "Shop six curated N7 Cosmetics fragrance trios, bringing together signature Yusuf Bhai originals and recreation favourites.",
};

export default async function BundlesPage() {
  const collection = await getCollectionPage("bundles");
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero content={collection} design={design} />
      <CollectionCatalog collection={collection} design={design} />
    </>
  );
}
