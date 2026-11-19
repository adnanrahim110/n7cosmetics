import StripeRuntimeProvider from "@/components/commerce/StripeRuntimeProvider";
import AppShell from "@/components/layout/AppShell";
import SmoothScroller from "@/components/layout/SmoothScroller";
import { getStorefrontProductLabels } from "@/lib/commerce/catalog";
import { getGlobalStorefrontContent } from "@/lib/commerce/homepage";
import { getPublicSiteSettings } from "@/lib/commerce/settings";
import { getStorefrontStock } from "@/lib/commerce/stock-data";
import { getPublicStripeConfiguration } from "@/lib/payments/settings";
import type { ReactNode } from "react";
import { getGoogleReviewsSettings } from "@/lib/google-reviews/settings";
import { defaultGoogleReviewsSettings } from "@/lib/google-reviews/config";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [settings, content, productLabels, stock, paymentConfig, googleReviews] =
    await Promise.all([
      getPublicSiteSettings(),
      getGlobalStorefrontContent(),
      getStorefrontProductLabels(),
      getStorefrontStock(),
      getPublicStripeConfiguration(),
      getGoogleReviewsSettings().then(value => value.settings).catch(() => defaultGoogleReviewsSettings),
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
          googleReviews={googleReviews}
        >
          {children}
        </AppShell>
      </StripeRuntimeProvider>
    </SmoothScroller>
  );
}
