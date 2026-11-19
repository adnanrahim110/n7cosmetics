import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import type { z } from "zod";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { writeAuditLog } from "../auth/audit";
import type { confirmReviewOriginSchema, ReviewOrigin, ReviewOriginFormState } from "./provenance";

export interface ReviewOriginRecord {
  id: string; product_id: string | null; rating: number; reviewer_name: string; title: string | null;
  body: string; submitted_at: Date; review_origin: ReviewOrigin; is_incentivized_review: number | null;
}
export function reviewOriginRevision(row: ReviewOriginRecord): string {
  return createHash("sha256").update(JSON.stringify([row.id, row.product_id, row.rating, row.reviewer_name,
    row.title, row.body, new Date(row.submitted_at).toISOString(), row.review_origin, row.is_incentivized_review])).digest("hex");
}

export async function confirmCustomerReviewOrigin(input: z.infer<typeof confirmReviewOriginSchema>, administratorId: string): Promise<ReviewOriginFormState> {
  return withTransaction(async connection => {
    const row = await selectOne<RowDataPacket & ReviewOriginRecord>(`SELECT CAST(id AS CHAR) id, CAST(product_id AS CHAR) product_id,
      rating, reviewer_name, title, body, submitted_at, review_origin, is_incentivized_review FROM product_reviews WHERE id = ? FOR UPDATE`, [input.reviewId], connection);
    if (!row || reviewOriginRevision(row) !== input.revision) return { error: "This review changed. Refresh the page before confirming its source.", revision: input.revision };
    await executeMutation("UPDATE product_reviews SET review_origin='CONFIRMED_CUSTOMER', is_incentivized_review=? WHERE id=?",
      [input.incentive === "UNKNOWN" ? null : input.incentive === "YES", input.reviewId], connection);
    await writeAuditLog({ administratorId, action: "PRODUCT_REVIEW_ORIGIN_CONFIRMED", entityType: "product_review", entityId: input.reviewId,
      summary: "Confirmed an original customer review source for Google syndication",
      metadata: { previousOrigin: row.review_origin, evidence: input.evidence, incentive: input.incentive } }, connection);
    return { success: true, revision: reviewOriginRevision({ ...row, review_origin: "CONFIRMED_CUSTOMER", is_incentivized_review: input.incentive === "UNKNOWN" ? null : Number(input.incentive === "YES") }) };
  });
}
