import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "../db/query";
import { validGtin, validMpn, merchantMpn, type MerchantMetadata } from "./metadata";
import { merchantText } from "./product";

export interface MerchantIdentity { gtin?: string; mpn?: string; brand?: string }
interface IdentityRow extends RowDataPacket { gtin: string | null; mpn: string | null; mpn_source: MerchantMetadata["mpnSource"] | null; brand: string | null; identifier_policy: string | null; product_code: string | null; is_recreation: number }

// Match Google's identity rules on the landing page, including main-product
// bundles and retailer-created multipacks. Never derive a barcode from a SKU.
export async function getMerchantStructuredIdentity(variantId: string): Promise<MerchantIdentity> {
  const row = await selectOne<IdentityRow>(`SELECT identity.gtin, identity.mpn, identity.mpn_source, identity.identifier_policy, source_product.brand, source_product.product_code,
    EXISTS (SELECT 1 FROM product_collections pc INNER JOIN collections collection ON collection.id = pc.collection_id
      WHERE pc.product_id = source_product.id AND collection.slug = 'recreations') AS is_recreation
    FROM product_variants v INNER JOIN products p ON p.id = v.product_id
    LEFT JOIN google_merchant_products own ON own.variant_id = v.id
    LEFT JOIN product_variants source ON source.id = CASE
      WHEN p.product_type = 'BUNDLE' AND own.bundle_kind = 'MAIN_PRODUCT' THEN
        (SELECT bi.component_variant_id FROM bundle_items bi WHERE bi.bundle_product_id = p.id AND bi.component_variant_id = own.main_variant_id LIMIT 1)
      WHEN p.product_type = 'BUNDLE' AND own.bundle_kind = 'MULTIPACK' THEN
        (SELECT MIN(bi.component_variant_id) FROM bundle_items bi WHERE bi.bundle_product_id = p.id HAVING COUNT(*) = 1 AND MIN(bi.quantity) >= 2)
      ELSE v.id END
    LEFT JOIN products source_product ON source_product.id = source.product_id
    LEFT JOIN google_merchant_products identity ON identity.variant_id = source.id
    WHERE v.id = ? LIMIT 1`, [variantId]);
  if (!row) return {};
  const brand = merchantText(row.brand ?? "");
  const gtin = row.identifier_policy !== "NONE" && row.gtin && validGtin(row.gtin) ? row.gtin : undefined;
  const candidate = merchantMpn({ mpn: row.mpn ?? "", mpnSource: row.mpn_source ?? (row.is_recreation ? "PRODUCT_CODE" : "MANUAL") }, row.product_code, Boolean(row.is_recreation));
  const mpn = row.identifier_policy !== "NONE" && validMpn(candidate) ? candidate : undefined;
  return { ...(gtin ? { gtin } : {}), ...(mpn ? { mpn } : {}), ...(brand ? { brand } : {}) };
}
