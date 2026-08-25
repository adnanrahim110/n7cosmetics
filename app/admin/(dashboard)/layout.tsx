import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgePercent,
  Boxes,
  ChevronRight,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Star,
  PanelsTopLeft,
  UserRound,
  Settings,
  Store,
  TicketPercent,
  Truck,
} from "lucide-react";
import { requireAdministrator } from "@/lib/auth/session";
import { logoutAction } from "./actions";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: PackageSearch },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/collections", label: "Collections", icon: Boxes },
  { href: "/admin/pages", label: "Pages", icon: PanelsTopLeft },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/discounts", label: "Discounts", icon: BadgePercent },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const administrator = await requireAdministrator();
  const visibleNavigation = administrator.role === "FULFILLMENT"
    ? navigation.filter((item) => item.href === "/admin" || item.href === "/admin/orders" || item.href === "/admin/profile")
    : navigation;

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-zinc-950 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-zinc-800">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-5">
          <span className="grid size-9 place-items-center rounded-lg bg-amber-600"><Store size={18} /></span>
          <div>
            <p className="text-sm font-semibold">N7 Cosmetics</p>
            <p className="text-xs text-zinc-400">Store administration</p>
          </div>
        </div>
        <nav aria-label="Admin navigation" className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-5 lg:block lg:space-y-1">
          {visibleNavigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
              <Icon aria-hidden="true" size={17} />
              <span>{label}</span>
              <ChevronRight aria-hidden="true" className="ml-auto hidden opacity-0 transition group-hover:opacity-100 lg:block" size={14} />
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-zinc-200 bg-white/95 px-5 shadow-sm backdrop-blur sm:px-7">
          <Link className="mr-4 text-right hover:text-amber-800" href="/admin/profile">
            <p className="text-sm font-medium">{administrator.name}</p>
            <p className="text-xs text-zinc-500">{administrator.role.toLowerCase()}</p>
          </Link>
          <form action={logoutAction}>
            <button aria-label="Sign out" className="grid size-9 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950" type="submit">
              <LogOut size={16} />
            </button>
          </form>
        </header>
        <main className="p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
