"use client";
import { trackMeta, updateMetaMatching } from "../meta/client";
import type { MetaEventName } from "../meta/shared";
import type { MetaMatchingInput } from "../meta/matching-input";
import { trackTikTok, updateTikTokMatching } from "../tiktok/client";

export async function trackMarketingEvent(name: MetaEventName, items: { slug: string; quantity: number }[] = [], extra: { couponCode?: string; reservationKey?: string } = {}): Promise<void> {
  await Promise.allSettled([trackMeta(name, items, extra), ...(name === "ViewCategory" ? [] : [trackTikTok(name === "PageView" ? "Pageview" : name, items, extra)])]);
}
export async function updateMarketingMatching(input: MetaMatchingInput): Promise<boolean> {
  const results = await Promise.allSettled([updateMetaMatching(input), updateTikTokMatching(input)]);
  return results.some(result => result.status === "fulfilled" && result.value);
}
