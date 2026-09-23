"use client";

import type { AdministratorRole } from "@/lib/auth/types";
import {
  Archive,
  BadgePercent,
  Boxes,
  ClipboardList,
  CreditCard,
  Flame,
  FolderTree,
  Heart,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  PackageOpen,
  PackageSearch,
  PanelsTopLeft,
  Settings,
  Star,
  TicketPercent,
  Truck,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  fulfillment?: boolean;
  activePaths?: readonly string[];
}

interface NavigationGroup {
  id: string;
  label: string;
  items: readonly NavigationItem[];
}

const navigationGroups: readonly NavigationGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: LayoutDashboard,
        fulfillment: true,
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: ClipboardList,
        fulfillment: true,
      },
      {
        href: "/admin/payments",
        label: "Payments & refunds",
        icon: CreditCard,
      },
      {
        href: "/admin/shipping",
        label: "Shipping",
        icon: Truck,
        activePaths: ["/admin/delivery"],
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: PackageSearch },
      { href: "/admin/bundles", label: "Bundles", icon: PackageOpen },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/collections", label: "Collections", icon: Boxes },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { href: "/admin/customers", label: "Customers", icon: UsersRound },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/saved-lists", label: "Saved lists", icon: Heart },
      { href: "/admin/emails", label: "Email & enquiries", icon: Mail },
    ],
  },
  {
    id: "storefront",
    label: "Marketing & content",
    items: [
      {
        href: "/admin/pages",
        label: "Pages",
        icon: PanelsTopLeft,
        activePaths: ["/admin/homepage"],
      },
      { href: "/admin/sales", label: "Sales", icon: Flame },
      { href: "/admin/discounts", label: "Discounts", icon: BadgePercent },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { href: "/admin/imports", label: "Historical data", icon: Archive },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      {
        href: "/admin/profile",
        label: "Profile",
        icon: UserRound,
        fulfillment: true,
      },
    ],
  },
];

function LogoutButton() {
  const { pending } = useFormStatus();
  const Icon = pending ? LoaderCircle : LogOut;

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/2.5 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/6 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
    >
      <Icon
        aria-hidden="true"
        size={17}
        strokeWidth={1.75}
        className={
          pending
            ? "shrink-0 animate-spin motion-reduce:animate-none"
            : "shrink-0"
        }
      />
      <span>{pending ? "Logging out…" : "Log out"}</span>
    </button>
  );
}

interface AdminSidebarProps {
  role: AdministratorRole;
  logoutAction: () => Promise<void>;
}

export default function AdminSidebar({
  role,
  logoutAction,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => role !== "FULFILLMENT" || item.fulfillment,
      ),
    }))
    .filter((group) => group.items.length > 0);

  function closeNavigation() {
    if (isOpen) {
      setIsOpen(false);
      menuButtonRef.current?.focus();
    }
  }

  return (
    <aside
      aria-label="Administration sidebar"
      className="flex h-dvh min-h-0 shrink-0 flex-col overflow-hidden border-b border-zinc-800 bg-zinc-950 text-white lg:h-full lg:max-h-none lg:border-b-0 lg:border-r"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          closeNavigation();
        }
      }}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/8 px-5">
        <Link
          href="/admin"
          onNavigate={closeNavigation}
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          <span
            aria-hidden="true"
            className="grid p-1.5 shrink-0 place-items-center rounded-md border border-amber-200/20 bg-amber-200/8 text-base font-semibold tracking-tight text-amber-100"
          >
            <img
              src="/imgs/fav.png"
              alt="N7 Cosmetics"
              className="w-6 h-auto invert-100"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-zinc-100">
              N7 Cosmetics
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
              Store administration
            </span>
          </span>
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          aria-label={
            isOpen ? "Close admin navigation" : "Open admin navigation"
          }
          aria-controls="admin-sidebar-panel"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-white/6 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-200 motion-reduce:transition-none lg:hidden"
        >
          {isOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </button>
      </div>

      <div
        id="admin-sidebar-panel"
        className={`${isOpen ? "flex" : "hidden"} min-h-0 flex-1 flex-col overflow-hidden lg:flex`}
      >
        <nav
          aria-label="Admin navigation"
          className="admin-scrollbar admin-scrollbar-dark min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-5"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {visibleGroups.map((group) => (
              <section key={group.id} aria-labelledby={`admin-nav-${group.id}`}>
                <h2
                  id={`admin-nav-${group.id}`}
                  className="mb-2 px-3 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400"
                >
                  {group.label}
                </h2>
                <ul className="space-y-0.5">
                  {group.items.map(
                    ({ href, label, icon: Icon, activePaths = [] }) => {
                      const isActive = [href, ...activePaths].some(
                        (path) =>
                          pathname === path ||
                          (path !== "/admin" &&
                            pathname.startsWith(`${path}/`)),
                      );

                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            aria-current={isActive ? "page" : undefined}
                            onNavigate={closeNavigation}
                            className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-[13px] leading-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-200 motion-reduce:transition-none lg:min-h-9 ${isActive ? "bg-amber-200/8 font-medium text-amber-100 ring-1 ring-inset ring-amber-200/10" : "text-zinc-300 hover:bg-white/4.5 hover:text-white"}`}
                          >
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-amber-200/80"
                              />
                            )}
                            <Icon
                              aria-hidden="true"
                              size={17}
                              strokeWidth={1.75}
                              className={`shrink-0 transition-colors motion-reduce:transition-none ${isActive ? "text-amber-200/90" : "text-zinc-500 group-hover:text-zinc-300"}`}
                            />
                            <span>{label}</span>
                          </Link>
                        </li>
                      );
                    },
                  )}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/8 bg-zinc-950 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form action={logoutAction}>
            <LogoutButton />
          </form>
        </div>
      </div>
    </aside>
  );
}
