import { getMerchantSnapshot, type MerchantSnapshot } from "./data";
import { merchantFeedXml } from "./xml";

// A failed read must never turn into a successful empty/partial replacement.
// Invalid individual products remain visible with reasons in the admin page.
export async function merchantFeedResponse(read: () => Promise<MerchantSnapshot> = getMerchantSnapshot): Promise<Response> {
  try {
    const snapshot = await read();
    if (snapshot.configurationError) throw new Error("Invalid Merchant feed origin.");
    const items = snapshot.entries.flatMap(entry => entry.item ? [entry.item] : []);
    if (!items.length && snapshot.entries.some(entry => !entry.excluded && entry.issues.length)) {
      throw new Error("No included products are ready for Google.");
    }
    return new Response(merchantFeedXml(items, snapshot.origin), { headers: {
      "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex",
    } });
  } catch {
    console.error("Google Merchant feed unavailable: check database access, Google Merchant migrations, APP_URL and product readiness.");
    return new Response("Product feed temporarily unavailable.", { status: 503, headers: {
      "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "300", "X-Robots-Tag": "noindex",
    } });
  }
}
