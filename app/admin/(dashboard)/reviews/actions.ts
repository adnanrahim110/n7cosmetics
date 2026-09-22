"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { formCheckbox, formString } from "@/lib/admin/form";
import { adminReviewInputSchema, type CreateReviewResult } from "@/lib/admin/reviews-validation";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const reviewStatusSchema = z.object({
  reviewId: z.string().regex(/^[1-9]\d*$/),
  status: z.enum(["PENDING", "PUBLISHED", "REJECTED"]),
});

export async function createReviewAction(formData: FormData): Promise<CreateReviewResult> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = adminReviewInputSchema.safeParse({
    productId: formString(formData, "productId"),
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    rating: formString(formData, "rating"),
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    recommendsProduct: formCheckbox(formData, "recommendsProduct"),
    reviewDate: formString(formData, "reviewDate"),
  });
  if (!parsed.success) {
    return { success: false, message: "Check the highlighted fields and try again.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const review = parsed.data;
  const metadata = await getRequestMetadata();
  let result: CreateReviewResult;
  try {
    result = await withTransaction<CreateReviewResult>(async (connection) => {
      const product = await selectOne<RowDataPacket>(
        "SELECT id FROM products WHERE id = ? LIMIT 1",
        [review.productId],
        connection,
      );
      if (!product) {
        return { success: false, message: "Select an available product.", fieldErrors: { productId: ["This product no longer exists. Select another product."] } };
      }

      // Store the selected calendar date directly so server timezone conversion cannot shift it.
      const reviewDate = `${review.reviewDate} 00:00:00.000`;
      const created = await executeMutation(
        `INSERT INTO product_reviews
           (product_id, status, rating, reviewer_name, reviewer_email, title, body,
            recommends_product, is_verified_purchase, ip_address, user_agent, submitted_at, published_at)
         VALUES (?, 'PUBLISHED', ?, ?, ?, ?, ?, ?,
           EXISTS(
             SELECT 1 FROM orders o
             INNER JOIN order_items oi ON oi.order_id = o.id
             WHERE LOWER(o.customer_email) = ? AND oi.product_id = ?
               AND o.status NOT IN ('CANCELLED', 'REFUNDED')
               AND o.payment_status IN ('PAID', 'PARTIALLY_REFUNDED')
             LIMIT 1
           ), ?, ?, ?, ?)`,
        [review.productId, review.rating, review.name, review.email ?? null, review.title ?? null, review.body,
         review.recommendsProduct, review.email ?? null, review.productId, metadata.ipAddress,
         metadata.userAgent, reviewDate, reviewDate],
        connection,
      );
      await writeAuditLog({
        administratorId: administrator.id,
        action: "PRODUCT_REVIEW_CREATE",
        entityType: "product_review",
        entityId: String(created.insertId),
        summary: "Manually added and published a product review",
        metadata: { productId: review.productId, reviewDate: review.reviewDate },
        ipAddress: metadata.ipAddress,
      }, connection);
      return { success: true };
    });
  } catch (error) {
    console.error("Admin review creation failed", error);
    return { success: false, message: "The review could not be saved. Please try again." };
  }

  if (result.success) {
    revalidatePath("/admin/reviews");
    revalidatePath("/products", "layout");
    revalidatePath("/bundles", "layout");
  }
  return result;
}

export async function updateReviewStatusAction(formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = reviewStatusSchema.safeParse({
    reviewId: formData.get("reviewId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await executeMutation(
    `UPDATE product_reviews
     SET status = ?, published_at = CASE
       WHEN ? = 'PUBLISHED' THEN COALESCE(published_at, CURRENT_TIMESTAMP(3))
       ELSE published_at
     END
     WHERE id = ?`,
    [parsed.data.status, parsed.data.status, parsed.data.reviewId],
  );
  const metadata = await getRequestMetadata();
  await writeAuditLog({
    administratorId: administrator.id,
    action: "PRODUCT_REVIEW_STATUS_UPDATE",
    entityType: "product_review",
    entityId: parsed.data.reviewId,
    summary: `Set product review to ${parsed.data.status}`,
    ipAddress: metadata.ipAddress,
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/products", "layout");
  revalidatePath("/bundles", "layout");
}
