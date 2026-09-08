import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import SmoothScroller from "@/components/layout/SmoothScroller";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { getGlobalStorefrontContent } from "@/lib/commerce/homepage";
import { getStorefrontProductCodes } from "@/lib/commerce/catalog";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [settings, content, productCodes] = await Promise.all([getPublicSiteSettings(), getGlobalStorefrontContent(), getStorefrontProductCodes()]);
  return (
    <SmoothScroller>
      <AppShell footerContent={content.footer} headerContent={content.header} productCodes={productCodes} settings={settings}>{children}</AppShell>
    </SmoothScroller>
  );
}
