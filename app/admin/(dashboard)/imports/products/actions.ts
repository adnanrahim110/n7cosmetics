"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { requireAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { isDatabaseId } from "@/lib/admin/form";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
export async function mapProductAction(legacyId: string, form: FormData) {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const productId = String(form.get("productId") ?? "");
  if (!isDatabaseId(legacyId) || (productId && !isDatabaseId(productId))) redirect("/admin/imports/products?error=invalid");
  await withTransaction(async connection => {
    const old = await selectOne<RowDataPacket>("SELECT legacy_id FROM legacy_products WHERE legacy_id=? FOR UPDATE", [legacyId], connection);
    if (!old) throw new Error("Original product not found.");
    const target = productId ? await selectOne<RowDataPacket>("SELECT CAST(p.id AS CHAR) id,CAST(v.id AS CHAR) variant_id FROM products p JOIN product_variants v ON v.product_id=p.id WHERE p.id=? ORDER BY v.is_default DESC,v.id LIMIT 1", [productId], connection) : null;
    if (productId && !target) throw new Error("The selected product needs a variant.");
    await executeMutation("UPDATE legacy_products SET product_id=?,variant_id=?,match_method=? WHERE legacy_id=?", [target?.id ?? null, target?.variant_id ?? null, target ? "Manual match" : null, legacyId], connection);
    await executeMutation("UPDATE product_reviews SET product_id=? WHERE legacy_product_id=? AND source='LEGACY'", [target?.id ?? null, legacyId], connection);
    await executeMutation("UPDATE order_items SET product_id=?,variant_id=? WHERE legacy_product_id=? AND legacy_id IS NOT NULL", [target?.id ?? null, target?.variant_id ?? null, legacyId], connection);
    await executeMutation("UPDATE customer_wishlist_items SET product_id=? WHERE legacy_product_id=?", [target?.id ?? null, legacyId], connection);
  });
  await writeAuditLog({ administratorId: admin.id, action: "LEGACY_PRODUCT_MAP", entityType: "legacy_product", entityId: legacyId, summary: productId ? `Linked to product ${productId}` : "Removed product match" });
  revalidatePath("/admin/imports/products"); revalidatePath("/admin/reviews"); revalidatePath("/products", "layout"); revalidatePath("/bundles", "layout"); redirect("/admin/imports/products?saved=1");
}
