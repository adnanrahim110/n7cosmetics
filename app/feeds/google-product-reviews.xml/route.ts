import { productReviewFeedResponse } from "@/lib/google-product-reviews/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return productReviewFeedResponse(); }
