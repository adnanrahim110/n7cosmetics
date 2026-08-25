"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";

const reviewStatusSchema = z.object({
  reviewId: z.string().regex(/^[1-9]\d*$/),
  status: z.enum(["PENDING", "PUBLISHED", "REJECTED"]),
});

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
       ELSE NULL
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
}
