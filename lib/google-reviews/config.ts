import { z } from "zod";

export const googleReviewsSettingKey = "google.customer_reviews";
export const googleReviewsSettingsSchema = z.object({
  merchantId: z.string().trim().regex(/^[1-9]\d{0,14}$|^$/, "Enter your numeric Merchant Center ID.")
    .refine(value => !value || Number.isSafeInteger(Number(value)), "Enter a valid Merchant Center ID."),
  surveyEnabled: z.boolean(),
  widgetEnabled: z.boolean(),
  fallbackDeliveryDays: z.number().int().min(1).max(30),
  widgetPosition: z.enum(["LEFT_BOTTOM", "RIGHT_BOTTOM"]),
  widgetRegion: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$|^$/, "Use a two-letter country code or leave blank for automatic detection."),
  widgetBottomMargin: z.number().int().min(16).max(240).multipleOf(4),
  widgetMobileBottomMargin: z.number().int().min(16).max(240).multipleOf(4),
}).refine(value => !value.surveyEnabled && !value.widgetEnabled || Boolean(value.merchantId), {
  message: "A Merchant Center ID is required to enable Google Customer Reviews.", path: ["merchantId"],
});
export type GoogleReviewsSettings = z.infer<typeof googleReviewsSettingsSchema>;
export interface GoogleReviewsFormState { error?: string; success?: boolean; revision?: string; fieldErrors?: Record<string, string[]> }
export const defaultGoogleReviewsSettings: GoogleReviewsSettings = {
  merchantId: "", surveyEnabled: false, widgetEnabled: false, fallbackDeliveryDays: 5,
  widgetPosition: "LEFT_BOTTOM", widgetRegion: "GB", widgetBottomMargin: 24, widgetMobileBottomMargin: 112,
};

export function readGoogleReviewsSettings(value: unknown): GoogleReviewsSettings {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return { ...defaultGoogleReviewsSettings }; }
  }
  const result = googleReviewsSettingsSchema.safeParse(value);
  return result.success ? result.data : { ...defaultGoogleReviewsSettings };
}

export function googleReviewsStorefrontPath(path: string): boolean {
  return !/^\/(?:checkout|cart|admin|api|newsletter)(?:\/|$)/.test(path);
}

export function googleReviewsPublicOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".")
      && !/^(?:localhost|127\.|0\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname) ? url.origin : null;
  } catch { return null; }
}
