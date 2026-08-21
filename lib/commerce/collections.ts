import type { RowDataPacket } from "mysql2/promise";
import type { CollectionPageContent } from "@/content/collections";
import { collectionPages } from "@/content/collections";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";

interface CollectionProductRow extends RowDataPacket { name: string; category: string | null; price_pence: number; image_url: string | null }

export async function getCollectionPage(key: keyof typeof collectionPages): Promise<CollectionPageContent> {
  const base = collectionPages[key];
  if (!hasDatabaseConfig()) return base;
  const rows = await selectRows<CollectionProductRow>(`SELECT p.name, (SELECT c.name FROM product_categories pc INNER JOIN categories c ON c.id = pc.category_id WHERE pc.product_id = p.id ORDER BY c.sort_order, c.name LIMIT 1) AS category, v.price_pence, (SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image_url FROM product_collections pcl INNER JOIN collections col ON col.id = pcl.collection_id AND col.status = 'ACTIVE' INNER JOIN products p ON p.id = pcl.product_id AND p.status = 'ACTIVE' INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE' WHERE col.slug = ? ORDER BY pcl.sort_order, p.name`, [base.slug]);
  return { ...base, products: rows.map((row) => ({ name: row.name, category: row.category ?? "Fragrance", price: row.price_pence / 100, image: row.image_url ?? "/imgs/products/1.png" })) };
}
