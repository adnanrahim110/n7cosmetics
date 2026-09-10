import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { MIN_SEARCH_QUERY_LENGTH, normalizeSearchQuery, rankProductSearchResults } from "@/lib/commerce/product-search";

const MAX_RESULTS = 8;

interface ProductSearchRow extends RowDataPacket {
  id: string;
  product_type: "STANDARD" | "BUNDLE";
  slug: string;
  name: string;
  brand: string | null;
  inspired_by: string | null;
  product_code: string | null;
  category: string | null;
  categories: string | null;
  collections: string | null;
  sku: string;
  audience: string;
  fragrance_notes_json: unknown;
  short_description: string | null;
  description: string | null;
  featured: number;
  price_pence: number;
  compare_at_price_pence: number | null;
  image_url: string;
  image_alt: string | null;
}

export async function GET(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { error: "Product search is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const query = normalizeSearchQuery(new URL(request.url).searchParams.get("q") ?? "");

  if (query.length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json(
      { results: [] },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  }

  try {
    const rows = await selectRows<ProductSearchRow>(
      `SELECT CAST(p.id AS CHAR) AS id, p.product_type, p.slug, p.name, p.brand, p.inspired_by, p.product_code,
         p.audience, p.fragrance_notes_json, p.short_description, p.description, p.featured, v.sku,
         (SELECT category.name
          FROM product_categories pc
          INNER JOIN categories category ON category.id = pc.category_id
          WHERE pc.product_id = p.id AND category.status = 'ACTIVE'
          ORDER BY category.sort_order, category.name
          LIMIT 1) AS category,
         (SELECT GROUP_CONCAT(category.name SEPARATOR ' ')
          FROM product_categories pc
          INNER JOIN categories category ON category.id = pc.category_id AND category.status = 'ACTIVE'
          WHERE pc.product_id = p.id) AS categories,
         (SELECT GROUP_CONCAT(collection.name SEPARATOR ' ')
          FROM product_collections pc
          INNER JOIN collections collection ON collection.id = pc.collection_id AND collection.status = 'ACTIVE'
          WHERE pc.product_id = p.id) AS collections,
         v.price_pence, v.compare_at_price_pence,
         image.url AS image_url, image.alt_text AS image_alt
       FROM products p
       INNER JOIN product_variants v
         ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
       INNER JOIN product_images image ON image.id = (
         SELECT pi.id
         FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.sort_order, pi.id
         LIMIT 1
       )
       WHERE p.status = 'ACTIVE'`,
    );

    // Rank the complete visible catalog before limiting, so typo-only matches
    // are not discarded by a literal SQL filter or an arbitrary candidate cap.
    const matches = rankProductSearchResults(rows.map((row) => ({
      ...row,
      inspiredBy: row.inspired_by,
      productCode: row.product_code,
      productType: row.product_type,
      notes: row.fragrance_notes_json,
      shortDescription: row.short_description,
      featured: Boolean(row.featured),
    })), query, MAX_RESULTS);

    const results = matches.map((row) => ({
      id: row.id,
      productType: row.product_type,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      inspiredBy: row.inspired_by,
      productCode: row.product_code,
      category: row.category ?? (row.product_type === "BUNDLE" ? "Bundle" : "Fragrance"),
      pricePence: Number(row.price_pence),
      compareAtPricePence:
        row.compare_at_price_pence === null
          ? null
          : Number(row.compare_at_price_pence),
      image: row.image_url,
      imageAlt: row.image_alt ?? `${row.name} product image`,
    }));

    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error("Product search failed", error);
    return NextResponse.json(
      { error: "Product search is temporarily unavailable." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
