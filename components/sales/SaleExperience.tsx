import ProductHero from "@/components/collections/CollectionHero";
import { collectionDesigns } from "@/components/collections/collection-config";
import type { SaleStorefrontContent } from "@/lib/commerce/sales";
import SaleCatalog from "./SaleCatalog";

export default function SaleExperience({ sale }: { sale: SaleStorefrontContent }) {
  return (
    <>
      <ProductHero content={sale} ctaHref="#sale-selection" ctaLabel="Build your selection" design={collectionDesigns.sale} itemLabel="products" />
      <SaleCatalog sale={sale} />
    </>
  );
}
