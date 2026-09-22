import { z } from "zod";
import { reviewInputSchema } from "../commerce/reviews-validation";

export const adminReviewInputSchema = reviewInputSchema.omit({
  productSlug: true,
  consent: true,
  email: true,
  title: true,
}).extend({
  email: z
    .string()
    .trim()
    .max(190, "Email is too long.")
    .transform((value) => value.toLowerCase())
    .nullish()
    .refine((value) => !value || z.email().safeParse(value).success, "Enter a valid email address.")
    .transform((value) => value || null),
  title: z
    .string()
    .trim()
    .max(120, "Title must be 120 characters or fewer.")
    .nullish()
    .transform((value) => value || null),
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
