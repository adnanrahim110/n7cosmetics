"use client";

import type { ReactNode } from "react";

import CustomCursor from "../ui/CustomCursor";
import CartDrawer from "../commerce/CartDrawer";
import CommerceProvider from "../commerce/CommerceProvider";
import type { PublicSiteSettings } from "../../lib/commerce/settings";
import Footer from "./Footer";
import Header from "./Header";
import type { FooterContent, HeaderContent } from "@/lib/homepage/types";
import type { StorefrontProductLabels } from "@/lib/commerce/catalog";

export default function AppShell({ children, settings, headerContent, footerContent, productLabels }: Readonly<{ children: ReactNode; settings?: PublicSiteSettings; headerContent: HeaderContent; footerContent: FooterContent; productLabels: Record<string, StorefrontProductLabels> }>) {
  return (
    <CommerceProvider productLabels={productLabels}>
      <div className="flex min-h-screen flex-col overflow-x-clip">
        <CustomCursor />
        <CartDrawer />
        <Header content={headerContent} />
        <main className="min-w-0 grow">{children}</main>
        <Footer content={footerContent} navigation={headerContent.navigation} settings={settings} />
      </div>
    </CommerceProvider>
  );
}
