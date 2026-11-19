import { z } from "zod";

export const googleReviewSurveySchema = z.object({
  merchant_id: z.number().int().positive().safe(),
  order_id: z.string().min(1).max(100),
  email: z.email().max(190),
  delivery_country: z.string().regex(/^[A-Z]{2}$/).refine(value => value !== "ZZ"),
  estimated_delivery_date: z.iso.date(),
  opt_in_style: z.literal("CENTER_DIALOG"),
}).strict();
export type GoogleReviewSurvey = z.infer<typeof googleReviewSurveySchema>;
