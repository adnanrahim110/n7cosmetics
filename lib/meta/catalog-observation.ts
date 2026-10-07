import { z } from "zod";

export const metaProductStatusSchema = z.object({
  id: z.string(), retailer_id: z.string(), image_url: z.string().optional(),
  image_fetch_status: z.string().optional(), review_status: z.string().optional(),
  capability_to_review_status: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  review_rejection_reasons: z.array(z.string()).optional(),
  errors: z.array(z.object({ error_type: z.string().optional(), error_priority: z.string().optional(), title: z.string().optional(), description: z.string().optional() })).optional(),
});
export const catalogObservationSchema = z.object({
  configurationRevision: z.string(), present: z.boolean(), metaId: z.string().nullable(),
  imageStatus: z.string(), imageMatches: z.boolean(), adReview: z.string().nullable(),
  review: z.string().nullable(),
  issues: z.array(z.object({ code: z.string(), priority: z.string(), title: z.string(), message: z.string() })),
});
export type CatalogObservation = z.infer<typeof catalogObservationSchema>;
export type CatalogEligibility = "ELIGIBLE" | "BLOCKED" | "PENDING" | "UNKNOWN";
export type CatalogImageState = "READY" | "PENDING" | "FAILED" | "UNKNOWN";

function plain(value: string): string {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&#0*39;|&apos;/gi, "'").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim().slice(0, 1200);
}
export function catalogObservation(product: z.infer<typeof metaProductStatusSchema> | undefined, expectedImage: string, revision: string): CatalogObservation {
  if (!product) return { configurationRevision: revision, present: false, metaId: null, imageStatus: "UNKNOWN", imageMatches: false, adReview: null, review: null, issues: [{ code: "not_found", priority: "high", title: "Product not returned by Meta", message: "Meta did not return this website item. Check the catalogue and sync status." }] };
  const issues = (product.errors ?? []).map(error => ({ code: plain(error.error_type ?? "product_issue"), priority: plain(error.error_priority ?? "unknown").toLowerCase(), title: plain(error.title ?? "Meta product issue"), message: plain(error.description ?? "Review this item in Commerce Manager.") }));
  for (const reason of product.review_rejection_reasons ?? []) issues.push({ code: "review_rejection", priority: "high", title: "Meta review rejection", message: plain(reason) });
  const imageMatches = product.image_url === expectedImage;
  if (!imageMatches) issues.push({ code: "image_outdated", priority: "warning", title: "Image update awaiting confirmation", message: "Meta has not returned the current website image URL yet." });
  return { configurationRevision: revision, present: true, metaId: product.id, imageStatus: product.image_fetch_status?.toUpperCase() || "UNKNOWN", imageMatches, adReview: product.capability_to_review_status?.find(entry => entry.key === "DA")?.value.toUpperCase() ?? null, review: product.review_status?.toUpperCase() || null, issues };
}
export function catalogImageState(observation: CatalogObservation | null): CatalogImageState {
  if (!observation?.present) return "UNKNOWN";
  if (observation.issues.some(issue => issue.code === "invalid_images" && issue.priority === "high")) return "FAILED";
  if (!observation.imageMatches) return "PENDING";
  if (["FETCHED", "DIRECT_UPLOAD"].includes(observation.imageStatus)) return "READY";
  if (["FETCH_FAILED", "PARTIAL_FETCH"].includes(observation.imageStatus)) return "FAILED";
  return ["NO_STATUS", "OUTDATED"].includes(observation.imageStatus) ? "PENDING" : "UNKNOWN";
}
export function catalogEligibility(observation: CatalogObservation | null): CatalogEligibility {
  if (!observation) return "UNKNOWN";
  const image = catalogImageState(observation);
  if (!observation.present || image === "FAILED" || observation.adReview === "REJECTED" || observation.issues.some(issue => issue.priority === "high")) return "BLOCKED";
  if (observation.adReview === "APPROVED" && image === "READY") return "ELIGIBLE";
  if (image === "PENDING" || ["PENDING", "OUTDATED"].includes(observation.adReview ?? "")) return "PENDING";
  // NO_REVIEW and an empty review result are not proof of ad approval.
  return "UNKNOWN";
}
