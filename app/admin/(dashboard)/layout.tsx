import { requireAdministrator } from "@/lib/auth/session";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { ReactNode } from "react";
import { logoutAction } from "./actions";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const administrator = await requireAdministrator();
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f6f5f2] text-zinc-950 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <AdminSidebar role={administrator.role} logoutAction={logoutAction} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader administrator={administrator} logoutAction={logoutAction} />
        <main
          aria-label="Admin content"
          tabIndex={0}
          className="admin-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-600 sm:p-7"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
