import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function AdminNotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 text-zinc-950">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-zinc-100 text-zinc-600"><SearchX size={22} /></span>
        <h1 className="mt-4 font-body text-xl font-semibold">This admin page isn’t available</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">It may have moved, or the item may no longer exist.</p>
        <Link className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" href="/admin"><ArrowLeft size={15} />Back to admin</Link>
      </section>
    </main>
  );
}
