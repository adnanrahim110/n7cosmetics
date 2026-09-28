import assert from "node:assert/strict";
import test from "node:test";
import type { PoolConnection } from "mysql2/promise";
import { deleteProductRecord, ProductDeletionError } from "../lib/admin/product-deletion";

function database({ missing = false, bundle = false, reserved = false, deleteFails = false } = {}) {
  const mutations: { sql: string; values: unknown[] }[] = [];
  const connection = {
    execute: async (sql: string, values: unknown[]) => {
      if (sql.startsWith("SELECT name, slug")) return [missing ? [] : [{ name: "Test fragrance", slug: "test-fragrance" }]];
      if (sql.startsWith("SELECT id FROM product_variants")) return [[{ id: "21" }]];
      if (sql.includes("SELECT p.name FROM bundle_items")) return [bundle ? [{ name: "Gift set" }] : []];
      if (sql.includes("SELECT r.order_id")) return [reserved ? [{ order_id: "31" }] : []];
      mutations.push({ sql, values });
      if (deleteFails && sql.startsWith("DELETE FROM products")) throw new Error("Database constraint");
      return [{ affectedRows: 1 }];
    },
  } as unknown as PoolConnection;
  return { connection, mutations };
}

test("invalid and missing products cannot trigger deletion or dependent changes", async () => {
  const { connection, mutations } = database({ missing: true });
  for (const id of ["", "0", "-1", "1 OR 1=1", "42"]) {
    await assert.rejects(deleteProductRecord(id, connection), (error: unknown) => error instanceof ProductDeletionError && !error.canSoftDelete);
  }
  assert.deepEqual(mutations, []);
});

test("bundle membership blocks deletion before any data changes", async () => {
  const { connection, mutations } = database({ bundle: true });
  await assert.rejects(deleteProductRecord("42", connection), (error: unknown) => error instanceof ProductDeletionError && error.canSoftDelete && error.message.includes("Gift set"));
  assert.deepEqual(mutations, []);
});

test("reserved checkout stock blocks deletion before any data changes", async () => {
  const { connection, mutations } = database({ reserved: true });
  await assert.rejects(deleteProductRecord("42", connection), (error: unknown) => error instanceof ProductDeletionError && error.canSoftDelete && error.message.includes("pending checkout"));
  assert.deepEqual(mutations, []);
});

test("deletion detaches historical catalog links and preserves order records", async () => {
  const { connection, mutations } = database();
  assert.deepEqual(await deleteProductRecord("42", connection), { name: "Test fragrance", slug: "test-fragrance" });
  assert.ok(mutations.some(({ sql }) => sql.includes("UPDATE legacy_products SET product_id = NULL")));
  assert.ok(mutations.some(({ sql }) => sql.includes("SET l.variant_id = NULL")));
  assert.ok(mutations.some(({ sql }) => sql.includes("UPDATE customer_wishlist_items SET product_id = NULL")));
  const reservationCleanup = mutations.find(({ sql }) => sql.includes("DELETE r FROM checkout_stock_reservations"));
  assert.ok(reservationCleanup?.sql.includes("c.inventory_state IN ('COMMITTED', 'RELEASED')"));
  assert.ok(mutations.every(({ values }) => values.length === 1 && values[0] === "42"));
  assert.ok(mutations.every(({ sql }) => !/\b(?:orders|order_items)\b/.test(sql)));
  assert.match(mutations.at(-1)!.sql, /^DELETE FROM products.*product_type = 'STANDARD'/);
});

test("database failures propagate to the transaction instead of reporting success", async () => {
  const { connection } = database({ deleteFails: true });
  await assert.rejects(deleteProductRecord("42", connection), /Database constraint/);
});
