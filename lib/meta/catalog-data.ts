import { getCatalogExport } from "../commerce/catalog-export";
import { getApplicationConfig } from "../env";
import { buildCatalogItem, type CatalogItem } from "./catalog-product";
import { metaContentId } from "./shared";

export interface CatalogSnapshotItem { id: string; name: string; item?: CatalogItem; error?: string }
export async function getCatalogSnapshot(): Promise<CatalogSnapshotItem[]> {
  const products = await getCatalogExport();
  return products.map(product => {
    const result = buildCatalogItem(product, getApplicationConfig().appUrl);
    return { id: metaContentId(product.variantId), name: `${product.productCode?.trim() ? `${product.productCode.trim()} — ` : ""}${product.name}`.slice(0, 190), ...result };
  });
}
