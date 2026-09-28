import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { isDatabaseId } from "./form";

export class ProductDeletionError extends Error {
  constructor(message: string, readonly canSoftDelete = false) {
    super(message);
  }
}

export type DeleteProductResult = { success: true } | { success: false; message: string; canSoftDelete?: boolean };

export async function deleteProductRecord(productId: string, connection: PoolConnection) {
  if (!isDatabaseId(productId)) throw new ProductDeletionError("The product ID is invalid.");
  const product = await selectOne<RowDataPacket & { name: string; slug: string }>(
    "SELECT name, slug FROM products WHERE id = ? AND product_type = 'STANDARD' FOR UPDATE", [productId], connection,
  );
  if (!product) throw new ProductDeletionError("This product no longer exists. Refresh the product list.");

  // Lock variants before checking references so new checkouts/bundle links cannot race deletion.
  await selectRows("SELECT id FROM product_variants WHERE product_id = ? FOR UPDATE", [productId], connection);
  const bundle = await selectOne<RowDataPacket & { name: string }>(
    `SELECT p.name FROM bundle_items bi
     INNER JOIN product_variants v ON v.id = bi.component_variant_id
     INNER JOIN products p ON p.id = bi.bundle_product_id
     WHERE v.product_id = ? LIMIT 1 FOR UPDATE`, [productId], connection,
  );
  if (bundle) throw new ProductDeletionError(`This product belongs to the bundle “${bundle.name}” and cannot be permanently deleted while linked to it.`, true);

  const reservation = await selectOne(
    `SELECT r.order_id FROM checkout_stock_reservations r
     INNER JOIN product_variants v ON v.id = r.variant_id
     INNER JOIN stripe_checkouts c ON c.order_id = r.order_id
     WHERE v.product_id = ? AND c.inventory_state = 'RESERVED' LIMIT 1 FOR UPDATE`, [productId], connection,
  );
  if (reservation) throw new ProductDeletionError("This product is in a pending checkout and cannot be permanently deleted until the checkout is completed or cancelled.", true);

  // Keep imported records and order snapshots; only detach their catalog links.
  await executeMutation("UPDATE legacy_products SET product_id = NULL WHERE product_id = ?", [productId], connection);
  await executeMutation(
    "UPDATE legacy_products l INNER JOIN product_variants v ON v.id = l.variant_id SET l.variant_id = NULL WHERE v.product_id = ?", [productId], connection,
  );
  await executeMutation("UPDATE customer_wishlist_items SET product_id = NULL WHERE product_id = ?", [productId], connection);
  await executeMutation(
    `DELETE r FROM checkout_stock_reservations r
     INNER JOIN product_variants v ON v.id = r.variant_id
     INNER JOIN stripe_checkouts c ON c.order_id = r.order_id
     WHERE v.product_id = ? AND c.inventory_state IN ('COMMITTED', 'RELEASED')`, [productId], connection,
  );
  // Child catalog rows cascade; order item references become NULL and snapshots remain intact.
  await executeMutation("DELETE FROM products WHERE id = ? AND product_type = 'STANDARD'", [productId], connection);
  return product;
}
