import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { writeAuditLog } from "../auth/audit";
import { defaultMetadataForProduct, type MerchantMetadata } from "./metadata";
import { readMerchantMetadata } from "./data";

interface EditorRow extends RowDataPacket {
  variant_id: string; product_id: string; name: string; slug: string; status: string;
  product_type: "STANDARD" | "BUNDLE";
  product_code: string | null; is_recreation: number; brand: string | null;
}
interface ComponentRow extends RowDataPacket { variant_id: string; name: string; title: string; quantity: number; status: string; variant_status: string; product_type: string }
export interface MerchantEditor {
  variantId: string; productId: string; name: string; slug: string; status: string; productType: "STANDARD" | "BUNDLE";
  metadata: MerchantMetadata; revision: string; components: { variantId: string; name: string; variantTitle: string; quantity: number; active: boolean; productType: string }[];
  productCode: string | null; isRecreation: boolean;
}

export async function getMerchantEditor(variantId: string, connection?: PoolConnection, lock = false): Promise<MerchantEditor | null> {
  const row = await selectOne<EditorRow>(`SELECT CAST(v.id AS CHAR) AS variant_id, CAST(p.id AS CHAR) AS product_id,
    p.name, p.slug, p.status, p.product_type, p.product_code, p.brand,
    EXISTS (SELECT 1 FROM product_collections pc INNER JOIN collections collection ON collection.id = pc.collection_id
      WHERE pc.product_id = p.id AND collection.slug = 'recreations') AS is_recreation
    FROM product_variants v INNER JOIN products p ON p.id = v.product_id
    WHERE v.id = ? AND v.is_default = 1${lock ? " FOR UPDATE" : ""}`, [variantId], connection);
  if (!row) return null;
  const metadata = (await readMerchantMetadata(connection, variantId)).get(variantId) ?? defaultMetadataForProduct(Boolean(row.is_recreation));
  const components = row.product_type === "BUNDLE" ? await selectRows<ComponentRow>(`SELECT CAST(v.id AS CHAR) AS variant_id,
    p.name, v.title, bi.quantity, p.status, v.status AS variant_status, p.product_type FROM bundle_items bi
    INNER JOIN product_variants v ON v.id = bi.component_variant_id INNER JOIN products p ON p.id = v.product_id
    WHERE bi.bundle_product_id = ? ORDER BY bi.sort_order, bi.component_variant_id`, [row.product_id], connection) : [];
  const editorComponents = components.map(component => ({ variantId: component.variant_id, name: component.name,
    variantTitle: component.title, quantity: Number(component.quantity), productType: component.product_type,
    active: component.status === "ACTIVE" && component.variant_status === "ACTIVE" && component.product_type === "STANDARD" }));
  const revision = createHash("sha256").update(JSON.stringify({ metadata, name: row.name, brand: row.brand,
    productCode: row.product_code, productType: row.product_type, isRecreation: Boolean(row.is_recreation),
    components: [...editorComponents].sort((left, right) => left.variantId.localeCompare(right.variantId)),
  })).digest("hex");
  return {
    variantId: row.variant_id, productId: row.product_id, name: row.name, slug: row.slug, status: row.status, productType: row.product_type,
    metadata, revision,
    productCode: row.product_code, isRecreation: Boolean(row.is_recreation),
    components: editorComponents,
  };
}

export interface MerchantFormState { error?: string; fieldErrors?: Record<string, string[]> }

export async function invalidateGoogleBundleComposition(productId: string, nextVariantIds: readonly string[], connection: PoolConnection): Promise<void> {
  const rows = await selectRows<RowDataPacket & { variant_id: string; quantity: number }>(
    "SELECT CAST(component_variant_id AS CHAR) AS variant_id, quantity FROM bundle_items WHERE bundle_product_id = ?", [productId], connection);
  const previous = rows.map(row => `${row.variant_id}:${Number(row.quantity)}`).sort().join("|");
  const next = nextVariantIds.map(id => `${id}:1`).sort().join("|");
  if (previous === next) return;
  await executeMutation(`UPDATE google_merchant_products merchant INNER JOIN product_variants variant ON variant.id = merchant.variant_id
    SET merchant.bundle_kind = 'UNREVIEWED', merchant.main_variant_id = NULL WHERE variant.product_id = ?`, [productId], connection);
}

export async function saveMerchantMetadata(variantId: string, data: MerchantMetadata, revision: string, administratorId: string): Promise<{ error: string } | { storefrontPath: string }> {
  return withTransaction(async connection => {
    const editor = await getMerchantEditor(variantId, connection, true);
    if (!editor) return { error: "This product is no longer available. Return to the catalogue." };
    if (revision !== editor.revision) return { error: "These Google details changed in another session. Reload this page before saving." };
    if (editor.productType === "STANDARD" && (data.bundleKind !== "UNREVIEWED" || data.mainVariantId)) return { error: "Bundle settings can only be saved for a bundle." };
    if (data.mpnSource === "PRODUCT_CODE" && !editor.isRecreation) return { error: "Official product-code MPNs are configured only for N7 recreations." };
    if (editor.isRecreation && editor.productCode?.trim() && data.identifierPolicy === "NONE") return { error: "This recreation has an official N7 part number. Use its product code or enter the manufacturer's MPN." };
    if (data.bundleKind === "MAIN_PRODUCT" && !editor.components.some(component => component.variantId === data.mainVariantId && component.productType === "STANDARD")) return { error: "Choose a standard product included in this bundle." };
    if (data.bundleKind === "MULTIPACK" && (editor.components.length !== 1 || (editor.components[0]?.quantity ?? 0) < 2)) return { error: "A multipack must contain two or more units of one identical product." };
    await executeMutation(`INSERT INTO google_merchant_products
      (variant_id, included, gtin, mpn, mpn_source, identifier_policy, google_category_id, bundle_kind, main_variant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE included = VALUES(included), gtin = VALUES(gtin),
      mpn = VALUES(mpn), mpn_source = VALUES(mpn_source), identifier_policy = VALUES(identifier_policy), google_category_id = VALUES(google_category_id),
      bundle_kind = VALUES(bundle_kind), main_variant_id = VALUES(main_variant_id)`,
    [variantId, data.included, data.gtin || null, data.mpn || null, data.mpnSource, data.identifierPolicy, data.googleCategoryId || null,
      data.bundleKind, data.bundleKind === "MAIN_PRODUCT" ? data.mainVariantId : null], connection);
    await writeAuditLog({ administratorId, action: "GOOGLE_MERCHANT_UPDATE", entityType: "product", entityId: editor.productId, summary: "Updated Google Merchant catalogue details" }, connection);
    return { storefrontPath: `/${editor.productType === "BUNDLE" ? "bundles" : "products"}/${editor.slug}` };
  });
}
