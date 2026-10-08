import type { RowDataPacket } from "mysql2/promise";
import { getCategoryBySlug } from "../commerce/categories";
import { selectOne, selectRows, type SqlValue } from "../db/query";
import { metaCategoryPath } from "./category-path";
import { metaContentId, type MetaCustomData } from "./shared";

export async function resolveMetaCategoryData(path: string): Promise<MetaCustomData> {
  const listing = metaCategoryPath(path);
  if (!listing) throw new Error("Category unavailable.");
  const { collectionSlug, categorySlug } = listing;
  let name: string;
  let membership: string;
  let order = "p.featured DESC, p.published_at DESC, p.name";
  const values: SqlValue[] = [];

  if (collectionSlug === "bundles") {
    name = "Bundles";
    membership = `p.product_type = 'BUNDLE'
      AND EXISTS (SELECT 1 FROM bundle_items bi WHERE bi.bundle_product_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM bundle_items bi
        INNER JOIN product_variants bv ON bv.id = bi.component_variant_id
        INNER JOIN products bp ON bp.id = bv.product_id
        WHERE bi.bundle_product_id = p.id AND (bv.status != 'ACTIVE' OR bp.status != 'ACTIVE' OR bp.product_type != 'STANDARD'))`;
  } else {
    const category = categorySlug ? await getCategoryBySlug(collectionSlug, categorySlug) : null;
    if (categorySlug && !category) throw new Error("Category unavailable.");
    const collection = await selectOne<RowDataPacket & { id: string; name: string }>(
      "SELECT CAST(id AS CHAR) AS id, name FROM collections WHERE slug = ? AND status = 'ACTIVE'", [collectionSlug],
    );
    if (!collection) throw new Error("Category unavailable.");
    name = category?.name ?? collection.name;
    membership = `p.product_type = 'STANDARD'
      AND EXISTS (SELECT 1 FROM product_collections pc WHERE pc.product_id = p.id AND pc.collection_id = ?)`;
    values.push(collection.id);
    if (category) {
      membership += " AND EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = ?)";
      values.push(category.id);
    }
    order = "(SELECT pc.sort_order FROM product_collections pc WHERE pc.product_id = p.id AND pc.collection_id = ?), p.name";
    values.push(collection.id);
  }

  // Fetch only catalogue IDs, bounded to ten; client-supplied products/prices are ignored.
  const products = await selectRows<RowDataPacket & { variant_id: string }>(
    `SELECT CAST(v.id AS CHAR) AS variant_id FROM products p
      INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
      WHERE p.status = 'ACTIVE' AND ${membership}
        AND EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
      ORDER BY ${order} LIMIT 10`, values,
  );
  return { content_name: name, content_category: name, content_type: "product", content_ids: products.map(product => metaContentId(product.variant_id)) };
}
