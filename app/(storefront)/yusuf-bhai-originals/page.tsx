import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Yusuf Bhai Originals | N7 Cosmetics",
  description: "Explore 21 original Yusuf Bhai fragrances across the Noble, Teeb and Deja Vu collections, available from N7 Cosmetics in the UK.",
};

export default async function YusufBhaiOriginalsPage() {
  const collection = await getCollectionPage("originals");
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero content={collection} design={design} />
      <CollectionCatalog collection={collection} design={design} />
    </>
  );
}
