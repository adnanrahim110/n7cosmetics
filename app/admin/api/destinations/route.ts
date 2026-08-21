import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { storefrontDestinations, type DestinationValue } from "@/lib/admin/destination";
import { getCurrentAdministrator } from "@/lib/auth/session";
import { selectRows } from "@/lib/db/query";

interface ProductDestinationRow extends RowDataPacket {
  name: string;
  slug: string;
  sku: string | null;
  image_url: string | null;
}

function matchesStatic(destination: DestinationValue, query: string): boolean {
  if (!query) return true;
  return `${destination.label} ${destination.href} ${destination.description ?? ""}`.toLowerCase().includes(query);
}

export async function GET(request: Request) {
  const administrator = await getCurrentAdministrator();
  if (!administrator) return NextResponse.json({ error: "Sign in to search destinations." }, { status: 401 });
  if (administrator.role !== "OWNER" && administrator.role !== "MANAGER") return NextResponse.json({ error: "You do not have permission to edit storefront destinations." }, { status: 403 });

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100).toLowerCase() ?? "";
  const pattern = `%${query}%`;
  const products = await selectRows<ProductDestinationRow>(
    `SELECT p.name, p.slug, v.sku,
       (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     WHERE p.status = 'ACTIVE'
       AND (? = '' OR LOWER(p.name) LIKE ? OR LOWER(p.slug) LIKE ? OR LOWER(COALESCE(v.sku, '')) LIKE ?)
     ORDER BY p.featured DESC, p.name
     LIMIT 12`,
    [query, pattern, pattern, pattern],
  );

  const destinations: DestinationValue[] = [
    ...storefrontDestinations.filter((destination) => matchesStatic(destination, query)),
    ...products.map((product) => ({
      label: product.name,
      href: `/products/${product.slug}`,
      kind: "product" as const,
      description: product.sku ? `Product · ${product.sku}` : "Product page",
      mediaUrl: product.image_url,
    })),
  ].slice(0, 20);

  return NextResponse.json({ destinations }, { headers: { "Cache-Control": "private, no-store" } });
}
