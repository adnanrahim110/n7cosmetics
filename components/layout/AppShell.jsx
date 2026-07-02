"use client";

import CustomCursor from "../ui/CustomCursor";
import Footer from "./Footer";
import Header from "./Header";

export default function AppShell({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <CustomCursor />
      <Header />
      <main className="grow">{children}</main>
      <Footer />
    </div>
  );
}
