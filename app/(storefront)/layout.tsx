import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import SmoothScroller from "@/components/layout/SmoothScroller";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { getGlobalStorefrontContent } from "@/lib/commerce/homepage";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [settings, content] = await Promise.all([getPublicSiteSettings(), getGlobalStorefrontContent()]);
  return (
    <SmoothScroller>
      <AppShell footerContent={content.footer} headerContent={content.header} settings={settings}>{children}</AppShell>
    </SmoothScroller>
  );
}
