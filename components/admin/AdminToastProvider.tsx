"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TriangleAlert, X } from "lucide-react";
import toast, { ToastBar, Toaster } from "react-hot-toast";
import { resolveAdminToastFeedback, type AdminToastFeedback } from "@/lib/admin/toast-feedback";

function ToastCopy({ title, description }: Pick<AdminToastFeedback, "title" | "description">) {
  return <div className="min-w-0"><p className="text-sm font-semibold leading-5 text-zinc-950">{title}</p>{description ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p> : null}</div>;
}

export function showAdminToast(feedback: Omit<AdminToastFeedback, "consume">): string {
  const content = <ToastCopy title={feedback.title} description={feedback.description} />;
  const options = { id: feedback.id, duration: feedback.type === "error" ? 6500 : 5000 };
  if (feedback.type === "success") return toast.success(content, options);
  if (feedback.type === "error") return toast.error(content, options);
  return toast(content, { ...options, icon: <TriangleAlert aria-hidden="true" className="text-amber-600" size={20} /> });
}

export function AdminUrlToastListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef("");
  const serialized = searchParams.toString();

  useEffect(() => {
    const signature = `${pathname}?${serialized}`;
    if (shown.current === signature) return;
    const query = new URLSearchParams(serialized);
    const feedback = resolveAdminToastFeedback(pathname, query);
    if (!feedback.length) return;
    shown.current = signature;
    for (const message of feedback) showAdminToast(message);
    for (const param of new Set(feedback.flatMap((message) => message.consume))) query.delete(param);
    const cleanQuery = query.toString();
    const hash = window.location.hash;
    router.replace(`${pathname}${cleanQuery ? `?${cleanQuery}` : ""}${hash}`, { scroll: false });
  }, [pathname, router, serialized]);

  return null;
}

export default function AdminToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        gutter={12}
        position="top-right"
        reverseOrder={false}
        containerStyle={{ top: 76, right: 16, zIndex: 100 }}
        toastOptions={{
          duration: 5000,
          style: { width: "min(420px, calc(100vw - 32px))", maxWidth: 420, minWidth: 0, padding: "14px 12px", border: "1px solid #e4e4e7", borderRadius: 14, background: "rgba(255,255,255,0.98)", boxShadow: "0 18px 45px rgba(24,24,27,0.14)" },
          success: { iconTheme: { primary: "#047857", secondary: "#ecfdf5" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fef2f2" } },
        }}
      >
        {(currentToast) => (
          <ToastBar toast={currentToast}>
            {({ icon, message }) => (
              <div className="flex w-full items-start gap-3">
                <span className="mt-0.5 shrink-0">{icon}</span>
                <div className="min-w-0 flex-1" {...currentToast.ariaProps}>{message}</div>
                {currentToast.type !== "loading" ? <button aria-label="Dismiss notification" className="grid size-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" onClick={() => toast.dismiss(currentToast.id)} type="button"><X size={15} /></button> : null}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
}
