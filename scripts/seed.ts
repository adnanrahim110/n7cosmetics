import "./load-env";
import type { RowDataPacket } from "mysql2/promise";
import { collectionPages } from "../content/collections";
import { slugify } from "../lib/admin/form";
import { getPool } from "../lib/db/pool";
import { executeMutation, selectOne } from "../lib/db/query";
import { withTransaction } from "../lib/db/transaction";

interface IdRow extends RowDataPacket { id: string }

async function seedCatalog(): Promise<void> {
  await withTransaction(async (connection) => {
    for (const collection of Object.values(collectionPages)) {
      const collectionSlug = collection.slug;
      await executeMutation(
        `INSERT IGNORE INTO collections (name, slug, description, status, sort_order)
         VALUES (?, ?, ?, 'ACTIVE', ?)`,
        [`${collection.title.lead} ${collection.title.accent}`, collectionSlug, collection.intro, Object.values(collectionPages).indexOf(collection)],
        connection,
      );
      const collectionRow = await selectOne<IdRow>("SELECT CAST(id AS CHAR) AS id FROM collections WHERE slug = ?", [collectionSlug], connection);
      if (!collectionRow) throw new Error(`Unable to seed collection ${collectionSlug}`);

      for (const item of collection.products) {
        const categorySlug = slugify(item.category);
        await executeMutation(
          "INSERT IGNORE INTO categories (name, slug, status) VALUES (?, ?, 'ACTIVE')",
          [item.category, categorySlug], connection,
        );
        const category = await selectOne<IdRow>("SELECT CAST(id AS CHAR) AS id FROM categories WHERE slug = ?", [categorySlug], connection);
        if (!category) throw new Error(`Unable to seed category ${categorySlug}`);

        const productSlug = slugify(item.name);
        await executeMutation(
          `INSERT IGNORE INTO products
             (name, slug, status, short_description, audience, featured, track_inventory, published_at)
           VALUES (?, ?, 'ACTIVE', ?, 'UNSPECIFIED', 0, 1, CURRENT_TIMESTAMP(3))`,
          [item.name, productSlug, `${item.category} fragrance by N7 Cosmetics.`], connection,
        );
        const product = await selectOne<IdRow>("SELECT CAST(id AS CHAR) AS id FROM products WHERE slug = ?", [productSlug], connection);
        if (!product) throw new Error(`Unable to seed product ${productSlug}`);

        const sku = `N7-${productSlug.toUpperCase().slice(0, 76)}`;
        await executeMutation(
          `INSERT IGNORE INTO product_variants
             (product_id, title, sku, price_pence, stock_on_hand, low_stock_threshold, is_default, status)
           VALUES (?, 'Default', ?, ?, 100, 5, 1, 'ACTIVE')`,
          [product.id, sku, Math.round(item.price * 100)], connection,
        );
        await executeMutation(
          "INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)",
          [product.id, category.id], connection,
        );
        await executeMutation(
          "INSERT IGNORE INTO product_collections (product_id, collection_id, sort_order) VALUES (?, ?, ?)",
          [product.id, collectionRow.id, collection.products.indexOf(item)], connection,
        );
        const image = await selectOne<IdRow>("SELECT CAST(id AS CHAR) AS id FROM product_images WHERE product_id = ? LIMIT 1", [product.id], connection);
        if (!image) {
          await executeMutation(
            "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, 0)",
            [product.id, item.image, item.name], connection,
          );
        }
      }
    }
  });

  process.stdout.write("Initial storefront catalog seeded without overwriting existing records.\n");
  await getPool().end();
}

seedCatalog().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
  await getPool().end().catch(() => undefined);
});
