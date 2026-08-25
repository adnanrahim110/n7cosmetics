import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Fragrance Recreations | N7 Cosmetics",
  description: "Discover the Yusuf Bhai recreation collection: 60 independent interpretations of celebrated fragrance profiles for him, her and everyone.",
};

export default async function RecreationsPage() {
  const collection = await getCollectionPage("recreations");
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero content={collection} design={design} />
      <CollectionCatalog collection={collection} design={design} />
    </>
  );
}
