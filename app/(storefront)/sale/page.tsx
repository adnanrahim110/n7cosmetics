import CollectionCatalog from "@/components/collections/CollectionCatalog";
import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import { getCollectionPage } from "@/lib/commerce/collections";

export const metadata = {
  title: "Fragrance Sale | N7 Cosmetics",
  description:
    "Explore limited-time fragrance and gift-set offers from N7 Cosmetics, available only while stock lasts.",
};

export default async function SalePage() {
  const collection = await getCollectionPage("sale");
  const design = collectionDesigns[collection.slug];

  return (
    <>
      <ProductHero
        content={collection}
        design={design}
        ctaLabel="View current offers"
        itemLabel="offers"
      />
      <CollectionCatalog collection={collection} design={design} />
    </>
  );
}
