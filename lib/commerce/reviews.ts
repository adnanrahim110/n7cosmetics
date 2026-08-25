import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "@/lib/db/query";

export interface ProductReviewMedia {
  url: string;
  type: "image" | "video";
  alt: string;
}

export interface ProductReview {
  id: string;
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
  recommendsProduct: boolean;
  verifiedPurchase: boolean;
  publishedAt: Date;
  media: ProductReviewMedia[];
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Array<{ rating: number; count: number }>;
  reviews: ProductReview[];
}

interface ReviewRow extends RowDataPacket {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string;
  body: string;
  recommends_product: number;
  is_verified_purchase: number;
  published_at: Date;
}

interface ReviewMediaRow extends RowDataPacket {
  review_id: string;
  public_url: string;
  mime_type: string;
  original_name: string;
}

export async function getProductReviewSummary(productId: string): Promise<ProductReviewSummary> {
  const rows = await selectRows<ReviewRow>(
    `SELECT CAST(id AS CHAR) AS id, reviewer_name, rating, title, body,
       recommends_product, is_verified_purchase, published_at
     FROM product_reviews
     WHERE product_id = ? AND status = 'PUBLISHED'
     ORDER BY published_at DESC, id DESC
     LIMIT 100`,
    [productId],
  );

  const reviewIds = rows.map((review) => review.id);
  const mediaRows = reviewIds.length
    ? await selectRows<ReviewMediaRow>(
        `SELECT CAST(prm.review_id AS CHAR) AS review_id, ma.public_url, ma.mime_type, ma.original_name
         FROM product_review_media prm
         INNER JOIN media_assets ma ON ma.id = prm.media_asset_id
         WHERE prm.review_id IN (${reviewIds.map(() => "?").join(", ")})
         ORDER BY prm.review_id, prm.sort_order, prm.id`,
        reviewIds,
      )
    : [];

  const mediaByReview = new Map<string, ProductReviewMedia[]>();
  for (const media of mediaRows) {
    const items = mediaByReview.get(media.review_id) ?? [];
    items.push({
      url: media.public_url,
      type: media.mime_type.startsWith("video/") ? "video" : "image",
      alt: media.original_name || "Customer review media",
    });
    mediaByReview.set(media.review_id, items);
  }

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: rows.filter((review) => Number(review.rating) === rating).length,
  }));
  const totalReviews = rows.length;
  const averageRating = totalReviews
    ? rows.reduce((total, review) => total + Number(review.rating), 0) / totalReviews
    : 0;

  return {
    averageRating,
    totalReviews,
    distribution,
    reviews: rows.map((review) => ({
      id: review.id,
      reviewerName: review.reviewer_name,
      rating: Number(review.rating),
      title: review.title,
      body: review.body,
      recommendsProduct: Boolean(review.recommends_product),
      verifiedPurchase: Boolean(review.is_verified_purchase),
      publishedAt: new Date(review.published_at),
      media: mediaByReview.get(review.id) ?? [],
    })),
  };
}
