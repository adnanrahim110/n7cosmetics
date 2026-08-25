import type { ReactNode } from "react";
import { Suspense } from "react";
import AdminToastProvider, { AdminUrlToastListener } from "@/components/admin/AdminToastProvider";

export default function AdminRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminToastProvider><Suspense fallback={null}><AdminUrlToastListener /></Suspense>{children}</AdminToastProvider>;
}
