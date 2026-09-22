import { z } from "zod";
import { reviewInputSchema } from "../commerce/reviews-validation";

export const adminReviewInputSchema = reviewInputSchema.omit({
  productSlug: true,
  consent: true,
}).extend({
  reviewDate: z.iso.date("Enter a valid review date.").refine(
    (value) => value >= "1000-01-01",
    "Review date must be on or after 1 January 1000.",
  ),
});

export type AdminReviewField = keyof z.infer<typeof adminReviewInputSchema>;

export type CreateReviewResult = {
  success: true;
} | {
  success: false;
  message: string;
  fieldErrors?: Partial<Record<AdminReviewField, string[]>>;
};
