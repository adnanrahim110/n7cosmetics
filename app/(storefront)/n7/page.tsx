import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "N7 Collection | N7 Cosmetics",
  description:
    "Discover the N7 Collection: a signature edit of expressive fragrances selected for presence, individuality, and lasting character.",
};

export default async function N7Page() {
  const collection = await getCollectionPage("n7");
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero content={collection} design={design} />
      <CollectionCatalog collection={collection} design={design} />
    </>
  );
}
