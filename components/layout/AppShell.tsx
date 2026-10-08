import MetaTracking from "@/components/meta/MetaTracking";
import type { StorefrontProductLabels } from "@/lib/commerce/catalog";
import type { StockSnapshot } from "@/lib/commerce/stock";
import type { FooterContent, HeaderContent } from "@/lib/homepage/types";
import type { ReactNode } from "react";
import type { PublicSiteSettings } from "../../lib/commerce/settings";
import CommerceProvider from "../commerce/CommerceProvider";
import Footer from "./Footer";
import Header from "./Header";
import StorefrontOverlays from "./StorefrontOverlays";

export default function AppShell({
  children,
  settings,
  headerContent,
  footerContent,
  productLabels,
  initialStock,
}: Readonly<{
  children: ReactNode;
  settings?: PublicSiteSettings;
  headerContent: HeaderContent;
  footerContent: FooterContent;
  productLabels: Record<string, StorefrontProductLabels>;
  initialStock: StockSnapshot;
}>) {
  return (
    <CommerceProvider productLabels={productLabels} initialStock={initialStock}>
      <MetaTracking />
      <div className="flex min-h-screen flex-col overflow-x-clip">
        <StorefrontOverlays />
        <Header content={headerContent} />
        <main className="min-w-0 grow">{children}</main>
        <Footer
          content={footerContent}
          navigation={headerContent.navigation}
          settings={settings}
        />
      </div>
    </CommerceProvider>
  );
}
