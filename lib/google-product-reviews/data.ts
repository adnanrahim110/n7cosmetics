import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { readMerchantSnapshot } from "../google-merchant/data";
import { hasCustomerReviewOrigin, type ReviewOrigin } from "./provenance";
import { validReviewXmlText, type ProductReviewFeedItem } from "./xml";

interface FeedReviewRow extends RowDataPacket {
  id: string; product_id: string | null; reviewer_name: string; rating: number; title: string | null; body: string;
  submitted_at: Date; review_origin: ReviewOrigin; is_incentivized_review: number | null; purchase_confirmed: number;
}
export interface ProductReviewFeedSnapshot {
  origin: string; configurationError: string | null; published: number; held: Record<string, number>;
  items: ProductReviewFeedItem[]; issues: { reviewId: string; message: string }[];
}

export async function getProductReviewFeedSnapshot(): Promise<ProductReviewFeedSnapshot> {
  return withTransaction(async connection => {
    const catalog = await readMerchantSnapshot(connection);
    const reviews = await selectRows<FeedReviewRow>(`SELECT CAST(review.id AS CHAR) id, CAST(review.product_id AS CHAR) product_id,
      review.reviewer_name, review.rating, review.title, review.body, review.submitted_at, review.review_origin, review.is_incentivized_review,
      (review.is_verified_purchase = 1 AND EXISTS (
        SELECT 1 FROM orders bought JOIN order_items line ON line.order_id = bought.id
        WHERE LOWER(bought.customer_email) = LOWER(review.reviewer_email) AND line.product_id = review.product_id
        AND bought.payment_status IN ('PAID','PARTIALLY_REFUNDED') AND bought.status NOT IN ('CANCELLED','REFUNDED','FAILED')
        AND COALESCE(bought.paid_at, bought.placed_at) <= review.submitted_at
      )) purchase_confirmed
      FROM product_reviews review WHERE review.status = 'PUBLISHED' ORDER BY review.id`, [], connection);
    const products = new Map(catalog.entries.map(entry => [entry.product.productId, entry]));
    const snapshot: ProductReviewFeedSnapshot = { origin: catalog.origin, configurationError: catalog.configurationError,
      published: reviews.length, held: {}, items: [], issues: [] };
    for (const review of reviews) {
      if (!hasCustomerReviewOrigin(review.review_origin)) {
        snapshot.held[review.review_origin] = (snapshot.held[review.review_origin] ?? 0) + 1;
        continue;
      }
      const entry = review.product_id ? products.get(review.product_id) : undefined;
      if (!entry?.item) {
        snapshot.issues.push({ reviewId: review.id, message: entry?.excluded ? "The reviewed product is excluded from the Google catalogue." : "The reviewed product needs an active landing page and valid Google catalogue details." });
        continue;
      }
      const timestamp = new Date(review.submitted_at);
      if (!review.body.trim() || !Number.isInteger(Number(review.rating)) || review.rating < 1 || review.rating > 5
        || !Number.isFinite(timestamp.getTime()) || timestamp.getTime() > Date.now()
        || ![review.body, review.title ?? "", review.reviewer_name].every(validReviewXmlText)) {
        snapshot.issues.push({ reviewId: review.id, message: "Check the original review text, rating and submission date." });
        continue;
      }
      const item = entry.item;
      snapshot.items.push({ id: `n7_review_${review.id}`, reviewer: review.reviewer_name, timestamp: timestamp.toISOString(),
        ...(review.title?.trim() ? { title: review.title } : {}), content: review.body, rating: Number(review.rating),
        verifiedPurchase: Boolean(review.purchase_confirmed),
        ...(review.is_incentivized_review === null ? {} : { incentivized: Boolean(review.is_incentivized_review) }),
        product: { name: item.title, url: item.link, skus: [...new Set([item.id, entry.product.sku].filter(Boolean))],
          ...(item.gtin ? { gtin: item.gtin } : {}), ...(item.mpn ? { mpn: item.mpn } : {}), ...(item.brand ? { brand: item.brand } : {}) },
      });
    }
    return snapshot;
  });
}
