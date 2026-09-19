import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { categoriesMatchCollections } from "../commerce/category-config";

export class CategoryAssignmentError extends Error {
  constructor() {
    super("Choose categories belonging to the product’s selected collections.");
  }
}

export async function validateCategoryAssignments(categoryIds: string[], collectionIds: string[], connection: PoolConnection) {
  if (!categoryIds.length) return;
  const categories = await selectRows<RowDataPacket & { id: string; collection_id: string }>(
    `SELECT CAST(c.id AS CHAR) AS id, CAST(c.collection_id AS CHAR) AS collection_id
     FROM categories c INNER JOIN collections col ON col.id = c.collection_id
     WHERE c.id IN (${categoryIds.map(() => "?").join(", ")}) AND col.status != 'ARCHIVED' FOR UPDATE`,
    categoryIds, connection,
  );
  if (!categoriesMatchCollections(categoryIds, collectionIds, categories)) throw new CategoryAssignmentError();
}
