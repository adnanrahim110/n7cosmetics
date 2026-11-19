import { z } from "zod";
import { isPaymentRequestOrigin } from "../payments/request";
import { readBoundedJson } from "../http/json";
import { googleReviewsPublicOrigin } from "./config";
import { getGoogleReviewSurvey } from "./orders";

const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export async function googleReviewSurveyResponse(request: Request): Promise<Response> {
  if (!isPaymentRequestOrigin(request)) return new Response(null, { status: 403, headers });
  if (!googleReviewsPublicOrigin(process.env.APP_URL ?? "")) return new Response(null, { status: 204, headers });
  let input: unknown;
  try { input = await readBoundedJson(request, 1024); } catch { return new Response(null, { status: 400, headers }); }
  const parsed = z.object({ key: z.uuid() }).strict().safeParse(input);
  if (!parsed.success) return new Response(null, { status: 400, headers });
  try {
    const survey = await getGoogleReviewSurvey(parsed.data.key);
    return survey ? Response.json(survey, { headers }) : new Response(null, { status: 204, headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
