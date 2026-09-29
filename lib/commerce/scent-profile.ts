import { z } from "zod";

const descriptors = z.array(z.string().trim().min(1).max(60)).max(8).default([]);
const level = z.number().int().min(1).max(5).nullable().default(null);

export const scentProfileSchema = z.object({
  families: descriptors,
  moods: descriptors,
  occasions: descriptors,
  seasons: descriptors,
  intensity: level,
  projection: level,
  longevity: z.string().trim().max(150).default(""),
  evidence: z.string().trim().max(500).default(""),
}).superRefine((profile, context) => {
  if ((profile.intensity !== null || profile.projection !== null || profile.longevity) && !profile.evidence) {
    context.addIssue({ code: "custom", path: ["evidence"], message: "Add a customer-facing test or survey source for performance claims, or leave performance empty." });
  }
});

export type ScentProfile = z.infer<typeof scentProfileSchema>;

export function readScentProfile(value: unknown): ScentProfile {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { value = {}; }
  }
  const result = scentProfileSchema.safeParse(value ?? {});
  return result.success ? result.data : scentProfileSchema.parse({});
}

export function scentProfileFormInput(form: FormData) {
  const text = (key: string) => String(form.get(`scent.${key}`) ?? "").trim();
  const list = (key: string) => [...new Set(text(key).split(/[,\n]/).map(value => value.trim()).filter(Boolean))];
  const rating = (key: string) => text(key) ? Number(text(key)) : null;
  return { families: list("families"), moods: list("moods"), occasions: list("occasions"), seasons: list("seasons"),
    intensity: rating("intensity"), projection: rating("projection"), longevity: text("longevity"), evidence: text("evidence") };
}
