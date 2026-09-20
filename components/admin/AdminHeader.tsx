"use client";

import { ChevronDown, ChevronRight, LoaderCircle, LogOut, Settings, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { useBodyAnchoredDropdown } from "@/components/ui/useBodyAnchoredDropdown";
import type { Administrator } from "@/lib/auth/types";

interface AdminHeaderProps {
  administrator: Pick<Administrator, "name" | "email" | "role">;
  logoutAction: () => Promise<void>;
}

const roleLabels = { OWNER: "Owner", MANAGER: "Manager", FULFILLMENT: "Fulfillment" } as const;
const accountLinks = [
  { href: "/admin/profile", label: "Profile", description: "Your details & password", icon: UserRound },
  { href: "/admin/settings", label: "Settings", description: "Store preferences", icon: Settings },
];

function AccountAvatar({ initials, large = false }: { initials: string; large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border border-amber-900/10 bg-linear-to-br from-[#fcf0d7] via-[#ebd1a3] to-[#cfa566] font-semibold tracking-wide text-[#68431e] shadow-[inset_0_1px_1px_#fff9,0_2px_5px_#78350f0d] ${large ? "size-11 text-sm" : "size-9 text-xs"}`}
    >
      {initials}
    </span>
  );
}

function LogoutMenuItem() {
  const { pending } = useFormStatus();
  const Icon = pending ? LoaderCircle : LogOut;

  return (
    <button
      aria-busy={pending}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-rose-700 outline-none transition-colors hover:bg-rose-50 focus-visible:bg-rose-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-200 disabled:cursor-wait disabled:opacity-60"
      data-label="Logout"
      disabled={pending}
      role="menuitem"
      tabIndex={-1}
      type="submit"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-50 transition-colors group-hover:bg-rose-100 group-focus-visible:bg-rose-100">
        <Icon aria-hidden="true" className={pending ? "motion-safe:animate-spin" : undefined} size={17} strokeWidth={1.7} />
      </span>
      <span className="text-[13px] font-medium">{pending ? "Logging out…" : "Logout"}</span>
    </button>
  );
}

function AccountMenu({ administrator, logoutAction }: AdminHeaderProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialFocus = useRef<"first" | "last">("first");
  const menuId = useId();
  const triggerId = useId();
  const reducedMotion = useReducedMotion();
  const { portalTarget, placement, style } = useBodyAnchoredDropdown(open, triggerRef, {
    align: "end",
    minimumWidth: 296,
    offset: 10,
    preferredHeight: 360,
  });
  const nameParts = administrator.name.trim().split(/\s+/).filter(Boolean);
  const initials = (nameParts.length > 1
    ? `${Array.from(nameParts[0])[0]}${Array.from(nameParts[nameParts.length - 1])[0]}`
    : Array.from(nameParts[0] ?? "N7").slice(0, 2).join("")
  ).toUpperCase();
  const visibleLinks = accountLinks.filter((item) => item.href !== "/admin/settings" || administrator.role !== "FULFILLMENT");

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const items = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)');
      if (items?.length) items[initialFocus.current === "last" ? items.length - 1 : 0].focus();
    });
    function dismissOutside(event: PointerEvent | FocusEvent) {
      if (event.target instanceof Node && !triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
    };
  }, [open]);

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      // Resume the page's tab order from the trigger, outside the body portal.
      close(true);
      return;
    }

    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % items.length;
    else if (event.key === "ArrowUp") nextIndex = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else if (event.key === " " && document.activeElement instanceof HTMLAnchorElement) {
      event.preventDefault();
      document.activeElement.click();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const match = items.findIndex((item) => item.dataset.label?.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match !== -1) nextIndex = match;
    }
    if (nextIndex !== undefined) {
      event.preventDefault();
      items[nextIndex].focus();
    }
  }

  return (
    <>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${administrator.name}, ${roleLabels[administrator.role]}. Open account menu`}
        className={`group flex min-w-0 max-w-full cursor-pointer items-center gap-3 rounded-xl border py-1.5 pl-1.5 pr-3 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-600/40 focus-visible:ring-offset-2 motion-reduce:transition-none ${open ? "border-amber-200/80 bg-amber-50/60" : "border-transparent hover:border-zinc-200/80 hover:bg-zinc-50"}`}
        id={triggerId}
        onClick={() => {
          initialFocus.current = "first";
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            initialFocus.current = event.key === "ArrowUp" ? "last" : "first";
            setOpen(true);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            close(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <AccountAvatar initials={initials} />
        <span className="min-w-0 max-w-36 sm:max-w-52">
          <span className="block truncate text-[13px] leading-5 font-semibold text-zinc-800">{administrator.name}</span>
          <span className="block text-[11px] leading-4 text-zinc-500">{roleLabels[administrator.role]}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`ml-1 shrink-0 text-zinc-400 transition-transform duration-200 group-hover:text-zinc-600 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} size={15} strokeWidth={1.7} />
      </button>

      {open && portalTarget ? createPortal(
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="admin-scrollbar overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200/80 bg-white shadow-[0_16px_48px_-12px_#18181b33,0_4px_12px_-4px_#18181b0f]"
          initial={reducedMotion ? false : { opacity: 0, y: placement === "top" ? 5 : -5, scale: 0.98 }}
          onKeyDown={handleMenuKeyDown}
          ref={panelRef}
          style={{ ...style, transformOrigin: placement === "top" ? "bottom right" : "top right" }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div className="border-b border-zinc-100 bg-linear-to-br from-[#fcfaf6] to-white px-4 py-4">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">My account</p>
            <div className="flex items-center gap-3">
              <AccountAvatar initials={initials} large />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{administrator.name}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500" title={administrator.email}>{administrator.email}</p>
              </div>
            </div>
          </div>
          <div aria-labelledby={triggerId} id={menuId} role="menu">
            <div className="space-y-0.5 p-2" role="none">
              {visibleLinks.map(({ href, label, description, icon: Icon }) => (
                <Link
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors hover:bg-amber-50/70 focus-visible:bg-amber-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200"
                  data-label={label}
                  href={href}
                  key={href}
                  onNavigate={() => close(true)}
                  role="menuitem"
                  tabIndex={-1}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-500 transition-colors group-hover:border-amber-200/70 group-hover:bg-amber-100/60 group-hover:text-amber-800 group-focus-visible:text-amber-800">
                    <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-zinc-800">{label}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">{description}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="text-zinc-300 transition-colors group-hover:text-amber-600" size={14} />
                </Link>
              ))}
            </div>
            <div className="mx-3 h-px bg-zinc-100" role="separator" />
            <form action={logoutAction} className="p-2" role="none">
              <LogoutMenuItem />
            </form>
          </div>
        </motion.div>,
        portalTarget,
      ) : null}
    </>
  );
}

export default function AdminHeader(props: AdminHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-end border-b border-zinc-200/80 bg-white/95 px-4 shadow-[0_1px_3px_#18181b03] backdrop-blur sm:px-7">
      <AccountMenu key={pathname} {...props} />
    </header>
  );
}
