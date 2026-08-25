"use client";

import type { ReactNode } from "react";

import CustomCursor from "../ui/CustomCursor";
import CartDrawer from "../commerce/CartDrawer";
import CommerceProvider from "../commerce/CommerceProvider";
import type { PublicSiteSettings } from "../../lib/commerce/settings";
import Footer from "./Footer";
import Header from "./Header";
import type { FooterContent, HeaderContent } from "@/lib/homepage/types";

export default function AppShell({ children, settings, headerContent, footerContent }: Readonly<{ children: ReactNode; settings?: PublicSiteSettings; headerContent: HeaderContent; footerContent: FooterContent }>) {
  return (
    <CommerceProvider>
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
