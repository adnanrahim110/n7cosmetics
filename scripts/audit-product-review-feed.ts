import "./load-env";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { getPool } from "../lib/db/pool";
import { getProductReviewFeedSnapshot } from "../lib/google-product-reviews/data";
import { productReviewFeedXml } from "../lib/google-product-reviews/xml";
import { merchantSiteOrigin } from "../lib/google-merchant/product";

async function run() {
  // An explicit origin permits offline validation against a local copy of the
  // catalogue. This changes this process only; stored settings remain untouched.
  const origin = process.argv.find(value => value.startsWith("--origin="))?.slice("--origin=".length);
  if (origin) process.env.APP_URL = merchantSiteOrigin(origin);
  try {
    const snapshot = await getProductReviewFeedSnapshot();
    const report = { origin: snapshot.origin, configurationError: snapshot.configurationError,
      published: snapshot.published, exported: snapshot.items.length, held: snapshot.held,
      verifiedPurchases: snapshot.items.filter(item => item.verifiedPurchase).length,
      ratingCounts: Object.fromEntries([1, 2, 3, 4, 5].map(rating => [rating, snapshot.items.filter(item => item.rating === rating).length])),
      issues: snapshot.issues };
    await mkdir("reports/product-review-feed", { recursive: true });
    await writeFile("reports/product-review-feed/audit.json", JSON.stringify(report, null, 2));
    if (!snapshot.configurationError && !snapshot.issues.length && snapshot.items.length) {
      await writeFile("reports/product-review-feed/google-product-reviews.xml", productReviewFeedXml(snapshot.items));
    } else {
      await rm("reports/product-review-feed/google-product-reviews.xml", { force: true });
    }
    console.log(JSON.stringify(report));
    if (snapshot.configurationError || snapshot.issues.length || !snapshot.items.length) process.exitCode = 1;
  } finally { await getPool().end(); }
}
void run().catch(() => { console.error("Review feed audit unavailable. Check database access and migration 043."); process.exitCode = 1; });
