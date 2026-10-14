"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stopTikTok, stopTikTokPage, trackTikTokPage } from "@/lib/tiktok/client";
import type { MetaPublicConfig } from "@/lib/meta/shared";

export default function TikTokTracking({ consent }: { consent: MetaPublicConfig["consent"] }) {
  const pathname = usePathname();
  useEffect(() => {
    if (consent === "granted") trackTikTokPage();
    else stopTikTok();
    return stopTikTokPage;
  }, [consent, pathname]);
  return null;
}
