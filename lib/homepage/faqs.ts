import { z } from "zod";
import type { FaqsContent } from "./types";

export const faqLimits = {
  items: 20,
  eyebrow: 150,
  title: 150,
  description: 1500,
  question: 240,
  answer: 3000,
} as const;

const text = (max: number) => z.string().trim().min(1).max(max);

export const faqsContentSchema = z.object({
  eyebrow: text(faqLimits.eyebrow),
  titleLead: text(faqLimits.title),
  titleAccent: z.string().trim().max(faqLimits.title),
  description: z.string().trim().max(faqLimits.description),
  items: z.array(z.object({
    question: text(faqLimits.question),
    answer: text(faqLimits.answer),
  })).max(faqLimits.items),
});

export function normalizeFaqsContent(value: unknown, fallback: FaqsContent): FaqsContent {
  if (typeof value === "string") {
    try {
      return normalizeFaqsContent(JSON.parse(value), fallback);
    } catch {
      return normalizeFaqsContent(undefined, fallback);
    }
  }
  const parsed = faqsContentSchema.safeParse(value);
  return parsed.success
    ? parsed.data
    : { ...fallback, items: fallback.items.map((item) => ({ ...item })) };
}
