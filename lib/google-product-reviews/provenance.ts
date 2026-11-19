import { z } from "zod";

export const reviewOrigins = ["UNKNOWN", "CUSTOMER_SUBMISSION", "LEGACY_IMPORT", "ADMIN_ENTRY", "CURATED_SEED", "CONFIRMED_CUSTOMER"] as const;
export type ReviewOrigin = typeof reviewOrigins[number];
export const reviewOriginLabels: Record<ReviewOrigin, string> = {
  UNKNOWN: "Source needs review", CUSTOMER_SUBMISSION: "Website submission", LEGACY_IMPORT: "WordPress customer import",
  ADMIN_ENTRY: "Admin entry — source unconfirmed", CURATED_SEED: "Curated seed — not exported", CONFIRMED_CUSTOMER: "Customer source confirmed",
};
export function hasCustomerReviewOrigin(origin: string): boolean {
  return ["CUSTOMER_SUBMISSION", "LEGACY_IMPORT", "CONFIRMED_CUSTOMER"].includes(origin);
}
export const confirmReviewOriginSchema = z.object({
  reviewId: z.string().regex(/^[1-9]\d*$/), revision: z.string().regex(/^[a-f0-9]{64}$/),
  confirmed: z.literal(true, { error: "Confirm that this is the customer's original review." }),
  evidence: z.string().trim().min(10, "Record the original customer source or reference.").max(500),
  incentive: z.enum(["UNKNOWN", "NO", "YES"]),
});
export interface ReviewOriginFormState { error?: string; success?: boolean; revision?: string }
