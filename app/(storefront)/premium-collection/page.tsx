import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Premium Fragrance Collection | N7 Cosmetics",
  description:
    "Discover a private edit of distinctive Yusuf Bhai originals and elevated fragrance recreations, selected by N7 Cosmetics for lasting character.",
};

export default async function PremiumCollectionPage() {
  const collection = await getCollectionPage("premium");
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero content={collection} design={design} />
      <CollectionCatalog collection={collection} design={design} />
    </>
  );
}
