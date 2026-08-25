import { z } from "zod";

export const reviewInputSchema = z.object({
  productId: z.string().regex(/^[1-9]\d*$/, "This product is unavailable."),
  productSlug: z.string().trim().min(1).max(190),
  name: z.string().trim().min(2, "Enter your name.").max(120, "Name is too long."),
  email: z.email("Enter a valid email address.").max(190, "Email is too long.").transform((value) => value.toLowerCase()),
  rating: z.coerce.number().int().min(1, "Choose a star rating.").max(5, "Choose a star rating."),
  title: z.string().trim().min(3, "Add a short title.").max(120, "Title must be 120 characters or fewer."),
  body: z.string().trim().min(20, "Share at least 20 characters about your experience.").max(3000, "Review must be 3,000 characters or fewer."),
  recommendsProduct: z.boolean(),
  consent: z.literal("on", { error: "Confirm that this review reflects your own experience." }),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
