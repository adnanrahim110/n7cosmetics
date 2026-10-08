import StripeRuntimeProvider from "@/components/commerce/StripeRuntimeProvider";
import AppShell from "@/components/layout/AppShell";
import SmoothScroller from "@/components/layout/SmoothScroller";
import { getStorefrontProductLabels } from "@/lib/commerce/catalog";
import { getGlobalStorefrontContent } from "@/lib/commerce/homepage";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { getStorefrontStock } from "@/lib/commerce/stock-data";
import { getPublicStripeConfiguration } from "@/lib/payments/settings";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [settings, content, productLabels, stock, paymentConfig] =
    await Promise.all([
      getPublicSiteSettings(),
      getGlobalStorefrontContent(),
      getStorefrontProductLabels(),
      getStorefrontStock(),
      getPublicStripeConfiguration(),
    ]);
  return (
    <SmoothScroller>
      <StripeRuntimeProvider initialConfig={paymentConfig}>
        <AppShell
          footerContent={content.footer}
          headerContent={content.header}
          productLabels={productLabels}
          initialStock={stock}
          settings={settings}
        >
          {children}
        </AppShell>
      </StripeRuntimeProvider>
    </SmoothScroller>
  );
}
