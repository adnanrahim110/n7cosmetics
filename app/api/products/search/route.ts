import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";

const MAX_QUERY_LENGTH = 80;
const MAX_QUERY_TERMS = 5;
const MAX_RESULTS = 8;

interface ProductSearchRow extends RowDataPacket {
  id: string;
  product_type: "STANDARD" | "BUNDLE";
  slug: string;
  name: string;
  brand: string | null;
  inspired_by: string | null;
  category: string | null;
  price_pence: number;
  compare_at_price_pence: number | null;
  image_url: string;
  image_alt: string | null;
}

function escapeLikePattern(value: string): string {
  return value.replaceAll("=", "==").replaceAll("%", "=%").replaceAll("_", "=_");
}

export async function GET(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { error: "Product search is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const query = new URL(request.url).searchParams
    .get("q")
    ?.trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_QUERY_LENGTH) ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { results: [] },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  }

  const terms = query.split(" ").slice(0, MAX_QUERY_TERMS);
  const filters = terms.map(
    () => `(
      p.name LIKE ? ESCAPE '='
      OR p.slug LIKE ? ESCAPE '='
      OR COALESCE(p.brand, '') LIKE ? ESCAPE '='
      OR COALESCE(p.inspired_by, '') LIKE ? ESCAPE '='
      OR v.sku LIKE ? ESCAPE '='
      OR COALESCE(p.short_description, '') LIKE ? ESCAPE '='
      OR EXISTS (
        SELECT 1
        FROM product_categories search_pc
        INNER JOIN categories search_category ON search_category.id = search_pc.category_id
        WHERE search_pc.product_id = p.id
          AND search_category.name LIKE ? ESCAPE '='
      )
    )`,
  );
  const filterValues = terms.flatMap((term) => {
    const pattern = `%${escapeLikePattern(term)}%`;
    return [pattern, pattern, pattern, pattern, pattern, pattern, pattern];
  });
  const escapedQuery = escapeLikePattern(query);
  const startsWithQuery = `${escapedQuery}%`;
  const containsQuery = `%${escapedQuery}%`;

  try {
    const rows = await selectRows<ProductSearchRow>(
      `SELECT CAST(p.id AS CHAR) AS id, p.product_type, p.slug, p.name, p.brand, p.inspired_by,
         (SELECT category.name
          FROM product_categories pc
          INNER JOIN categories category ON category.id = pc.category_id
          WHERE pc.product_id = p.id
          ORDER BY category.sort_order, category.name
          LIMIT 1) AS category,
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
       WHERE p.status = 'ACTIVE'
         AND ${filters.join(" AND ")}
       ORDER BY
         CASE
           WHEN p.name = ? THEN 0
           WHEN p.name LIKE ? ESCAPE '=' THEN 1
           WHEN p.name LIKE ? ESCAPE '=' THEN 2
           WHEN COALESCE(p.inspired_by, '') LIKE ? ESCAPE '=' THEN 3
           WHEN COALESCE(p.brand, '') LIKE ? ESCAPE '=' THEN 4
           ELSE 5
         END,
         p.featured DESC,
         p.name
       LIMIT ${MAX_RESULTS}`,
      [
        ...filterValues,
        query,
        startsWithQuery,
        containsQuery,
        containsQuery,
        containsQuery,
      ],
    );

    const results = rows.map((row) => ({
      id: row.id,
      productType: row.product_type,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      inspiredBy: row.inspired_by,
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
