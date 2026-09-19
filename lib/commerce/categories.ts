import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { categoryCollectionSlugs, categoryHref, isCategoryCollectionSlug } from "./category-config";

export interface CategoryRecord extends RowDataPacket {
  id: string;
  collection_id: string;
  collection_name: string;
  collection_slug: string;
  collection_status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: "ACTIVE" | "HIDDEN";
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface CategoryLink {
  id: string;
  name: string;
  href: string;
  collectionName: string;
  collectionSlug: string;
  image: string | null;
}

const categorySelect = `SELECT CAST(c.id AS CHAR) AS id, CAST(c.collection_id AS CHAR) AS collection_id,
  col.name AS collection_name, col.slug AS collection_slug, col.status AS collection_status,
  c.name, c.slug, c.description, c.image_url, c.status, c.sort_order, c.seo_title, c.seo_description
  FROM categories c INNER JOIN collections col ON col.id = c.collection_id`;

export async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  if (!/^[1-9]\d*$/.test(id) || !hasDatabaseConfig()) return null;
  const category = await selectOne<CategoryRecord>(`${categorySelect} WHERE c.id = ?`, [id]);
  return category && isCategoryCollectionSlug(category.collection_slug) ? category : null;
}

export async function getCategoryBySlug(collectionSlug: string, slug: string): Promise<CategoryRecord | null> {
  if (!isCategoryCollectionSlug(collectionSlug) || !hasDatabaseConfig()) return null;
  return selectOne<CategoryRecord>(
    `${categorySelect} WHERE col.slug = ? AND c.slug = ? AND col.status = 'ACTIVE' AND c.status = 'ACTIVE'`,
    [collectionSlug, slug],
  );
}

export async function getAvailableCategoryLinks(collectionSlug?: string): Promise<CategoryLink[]> {
  if (!hasDatabaseConfig() || (collectionSlug && !isCategoryCollectionSlug(collectionSlug))) return [];
  const rows = await selectRows<CategoryRecord>(
    `${categorySelect} WHERE c.status = 'ACTIVE' AND col.status = 'ACTIVE'
      AND col.slug IN (${categoryCollectionSlugs.map(() => "?").join(", ")})
      ${collectionSlug ? "AND col.slug = ?" : ""}
      ORDER BY col.sort_order, col.name, c.sort_order, c.name`,
    collectionSlug ? [...categoryCollectionSlugs, collectionSlug] : categoryCollectionSlugs,
  );
  return rows.map((category) => ({
    id: category.id, name: category.name,
    href: categoryHref(category.collection_slug, category.slug),
    collectionName: category.collection_name, collectionSlug: category.collection_slug,
    image: category.image_url,
  }));
}
