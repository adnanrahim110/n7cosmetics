import { merchantFeedResponse } from "@/lib/google-merchant/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { return merchantFeedResponse(); }
