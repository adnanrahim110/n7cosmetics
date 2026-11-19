import { googleReviewSurveyResponse } from "@/lib/google-reviews/endpoint";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return googleReviewSurveyResponse(request);
}
