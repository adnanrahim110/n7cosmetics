"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TriangleAlert, X } from "lucide-react";
import toast, { resolveValue, ToastBar, Toaster } from "react-hot-toast";
import { resolveAdminToastFeedback, type AdminToastFeedback } from "@/lib/admin/toast-feedback";

function ToastCopy({ title, description }: Pick<AdminToastFeedback, "title" | "description">) {
  return <div className="min-w-0 wrap-anywhere text-left"><p className="text-sm font-semibold leading-5 text-zinc-950">{title}</p>{description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}</div>;
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
        containerClassName="top-19! right-4! z-100!"
        toastOptions={{
          duration: 5000,
          className: "w-fit! min-w-0! max-w-[min(26.25rem,calc(100vw-2rem))]! rounded-xl! border border-zinc-200 bg-white/98! p-3! shadow-lg!",
          success: { iconTheme: { primary: "#047857", secondary: "#ecfdf5" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fef2f2" } },
        }}
      >
        {(currentToast) => (
          <ToastBar toast={currentToast}>
            {({ icon }) => (
              <div className="flex min-w-0 items-center gap-3">
                {icon ? <span className="shrink-0">{icon}</span> : null}
                <div className="min-w-0 wrap-anywhere text-left whitespace-pre-line" {...currentToast.ariaProps}>{resolveValue(currentToast.message, currentToast)}</div>
                {currentToast.type !== "loading" ? <button aria-label="Dismiss notification" className="grid size-11 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 motion-reduce:transition-none" onClick={() => toast.dismiss(currentToast.id)} type="button"><X aria-hidden="true" size={16} /></button> : null}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
}
