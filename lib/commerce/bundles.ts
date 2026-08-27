import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { getStorefrontProduct, type StorefrontProduct } from "./catalog";

export interface StorefrontBundleComponent {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantTitle: string;
  pricePence: number;
  stockOnHand: number;
  trackInventory: boolean;
  quantity: number;
  image: string;
  imageAlt: string;
}

export interface StorefrontBundle extends StorefrontProduct {
  components: StorefrontBundleComponent[];
  componentsAvailable: boolean;
}

interface BundleComponentRow extends RowDataPacket {
  product_id: string;
  variant_id: string;
  slug: string;
  name: string;
  variant_title: string;
  price_pence: number;
  stock_on_hand: number;
  track_inventory: number;
  quantity: number;
  image_url: string;
  image_alt: string | null;
}

interface BundleComponentCountRow extends RowDataPacket { component_count: number | string }

export async function getStorefrontBundle(slug: string): Promise<StorefrontBundle | null> {
  const bundle = await getStorefrontProduct(slug, "BUNDLE");
  if (!bundle || !hasDatabaseConfig()) return null;

  const [rows, countRow] = await Promise.all([
    selectRows<BundleComponentRow>(
      `SELECT
       CAST(p.id AS CHAR) AS product_id,
       CAST(v.id AS CHAR) AS variant_id,
       p.slug,
       p.name,
       v.title AS variant_title,
       v.price_pence,
       v.stock_on_hand,
       p.track_inventory,
       bi.quantity,
       image.url AS image_url,
       image.alt_text AS image_alt
     FROM bundle_items bi
     INNER JOIN product_variants v ON v.id = bi.component_variant_id AND v.status = 'ACTIVE'
     INNER JOIN products p ON p.id = v.product_id AND p.product_type = 'STANDARD' AND p.status = 'ACTIVE'
     INNER JOIN product_images image ON image.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     WHERE bi.bundle_product_id = ?
     ORDER BY bi.sort_order, bi.component_variant_id`,
      [bundle.id],
    ),
    selectRows<BundleComponentCountRow>("SELECT COUNT(*) AS component_count FROM bundle_items WHERE bundle_product_id = ?", [bundle.id]),
  ]);
  const expectedComponentCount = Number(countRow[0]?.component_count ?? 0);

  return {
    ...bundle,
    componentsAvailable: expectedComponentCount > 0 && rows.length === expectedComponentCount,
    components: rows.map((row) => ({
      productId: row.product_id,
      variantId: row.variant_id,
      slug: row.slug,
      name: row.name,
      variantTitle: row.variant_title,
      pricePence: Number(row.price_pence),
      stockOnHand: Number(row.stock_on_hand),
      trackInventory: Boolean(row.track_inventory),
      quantity: Number(row.quantity),
      image: row.image_url,
      imageAlt: row.image_alt ?? `${row.name} product image`,
    })),
  };
}
