import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { readCatalogExport } from "../commerce/catalog-export";
import { defaultMerchantMetadata, type MerchantMetadata } from "./metadata";
import { buildMerchantEntry, merchantSiteOrigin, type MerchantEntry, type MerchantIdentityProduct } from "./product";

interface MetadataRow extends RowDataPacket {
  variant_id: string; included: number; gtin: string | null; mpn: string | null;
  mpn_source: MerchantMetadata["mpnSource"];
  identifier_policy: MerchantMetadata["identifierPolicy"]; google_category_id: string | null;
  bundle_kind: MerchantMetadata["bundleKind"]; main_variant_id: string | null;
}
interface IdentityProductRow extends RowDataPacket {
  variant_id: string; product_type: "STANDARD" | "BUNDLE"; brand: string | null; product_code: string | null; is_recreation: number;
}

async function readComponentIdentities(connection: PoolConnection): Promise<MerchantIdentityProduct[]> {
  // A component's identity remains valid when it is inactive or no longer the
  // standalone default variant. Stock rules still make its bundle unavailable.
  const rows = await selectRows<IdentityProductRow>(`SELECT CAST(v.id AS CHAR) AS variant_id,
    p.product_type, p.brand, p.product_code,
    EXISTS (SELECT 1 FROM product_collections pc INNER JOIN collections collection ON collection.id = pc.collection_id
      WHERE pc.product_id = p.id AND collection.slug = 'recreations') AS is_recreation
    FROM product_variants v INNER JOIN products p ON p.id = v.product_id
    WHERE EXISTS (SELECT 1 FROM bundle_items bi INNER JOIN products bundle ON bundle.id = bi.bundle_product_id
      WHERE bi.component_variant_id = v.id AND bundle.status = 'ACTIVE')`, [], connection);
  return rows.map(row => ({ variantId: row.variant_id, productType: row.product_type, brand: row.brand,
    productCode: row.product_code, isRecreation: Boolean(row.is_recreation) }));
}

export async function readMerchantMetadata(connection?: PoolConnection, variantId?: string): Promise<Map<string, MerchantMetadata>> {
  const rows = await selectRows<MetadataRow>(`SELECT CAST(variant_id AS CHAR) AS variant_id, included, gtin, mpn, mpn_source,
    identifier_policy, google_category_id, bundle_kind, CAST(main_variant_id AS CHAR) AS main_variant_id FROM google_merchant_products${variantId ? " WHERE variant_id = ?" : ""}`, variantId ? [variantId] : [], connection);
  return new Map(rows.map(row => [row.variant_id, {
    included: Boolean(row.included), gtin: row.gtin ?? "", mpn: row.mpn ?? "", mpnSource: row.mpn_source, identifierPolicy: row.identifier_policy,
    googleCategoryId: row.google_category_id ?? "", bundleKind: row.bundle_kind, mainVariantId: row.main_variant_id ?? "",
  }]));
}

export interface MerchantSnapshot { entries: MerchantEntry[]; origin: string; configurationError: string | null }
export async function getMerchantSnapshot(): Promise<MerchantSnapshot> {
  let origin = "", configurationError: string | null = null;
  try { origin = merchantSiteOrigin(process.env.APP_URL ?? ""); }
  catch { configurationError = "Set APP_URL to the public HTTPS website origin before connecting the feed."; }
  return withTransaction(async connection => {
    const products = await readCatalogExport(connection);
    const metadata = await readMerchantMetadata(connection);
    const byVariant = new Map<string, MerchantIdentityProduct>(products.map(product => [product.variantId, product]));
    if (byVariant.size !== products.length) throw new Error("Duplicate published catalogue variants.");
    for (const component of await readComponentIdentities(connection)) {
      if (!byVariant.has(component.variantId)) byVariant.set(component.variantId, component);
    }
    const entries = products.map(product => buildMerchantEntry(product, origin, metadata, byVariant));
    return { entries, origin, configurationError };
  });
}

export { defaultMerchantMetadata };
