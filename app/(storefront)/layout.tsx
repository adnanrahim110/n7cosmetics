import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import SmoothScroller from "@/components/layout/SmoothScroller";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { getGlobalStorefrontContent } from "@/lib/commerce/homepage";
import { getStorefrontProductLabels } from "@/lib/commerce/catalog";
import { getStorefrontStock } from "@/lib/commerce/stock-data";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [settings, content, productLabels, stock] = await Promise.all([getPublicSiteSettings(), getGlobalStorefrontContent(), getStorefrontProductLabels(), getStorefrontStock()]);
  return (
    <SmoothScroller>
      <AppShell footerContent={content.footer} headerContent={content.header} productLabels={productLabels} initialStock={stock} settings={settings}>{children}</AppShell>
    </SmoothScroller>
  );
}
