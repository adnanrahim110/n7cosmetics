"use client";

import { useEffect } from "react";
import { RefreshCcw, TriangleAlert } from "lucide-react";
import { showAdminToast } from "@/components/admin/AdminToastProvider";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    showAdminToast({ id: "admin-page-error", type: "error", title: "This page couldn’t be loaded", description: "Your data is safe. Try loading the page again." });
  }, []);

  return (
    <section className="mx-auto mt-16 max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600"><TriangleAlert size={22} /></span>
      <h1 className="mt-4 font-body text-xl font-semibold text-zinc-950">We couldn’t load this page</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">Your data is safe. This may be a temporary problem, so please try again.</p>
      <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" onClick={reset} type="button"><RefreshCcw size={15} />Try again</button>
    </section>
  );
}
