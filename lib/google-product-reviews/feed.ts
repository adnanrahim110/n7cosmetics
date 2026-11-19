import { getProductReviewFeedSnapshot, type ProductReviewFeedSnapshot } from "./data";
import { productReviewFeedXml } from "./xml";

export async function productReviewFeedResponse(read: () => Promise<ProductReviewFeedSnapshot> = getProductReviewFeedSnapshot): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
  try {
    const snapshot = await read();
    // Full replacements must never quietly lose reviews after a bad read,
    // missing product mapping or invalid record. Diagnose these in Admin > Google.
    if (snapshot.configurationError || snapshot.issues.length || !snapshot.items.length) throw new Error("Feed needs attention");
    return new Response(productReviewFeedXml(snapshot.items), { headers: { ...headers, "Content-Type": "application/xml; charset=utf-8" } });
  } catch {
    return new Response("Product review feed temporarily unavailable. Check review provenance and product mappings in Admin > Google.",
      { status: 503, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300" } });
  }
}
