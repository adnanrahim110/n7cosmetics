"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { subscribeNewsletterAction, type NewsletterState } from "@/app/(storefront)/newsletter/actions";

const initialState: NewsletterState = { status: "idle", message: "" };
export default function NewsletterForm({ placeholder, buttonLabel }: { placeholder: string; buttonLabel: string }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, initialState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") form.current?.reset(); }, [state]);
  return <form action={action} className="w-full max-w-md" ref={form}>
    <div className="relative flex border-b border-white/20 pb-3 focus-within:border-[#967c55]">
      <input aria-label="Email for N7 fragrance updates" autoComplete="email" className="w-full bg-transparent pr-24 text-xs uppercase tracking-[0.16em] text-white placeholder-white/40 focus:outline-none" disabled={pending} maxLength={190} name="email" placeholder={placeholder} required type="email" />
      <button className="absolute right-0 bottom-3 text-xs font-medium tracking-widest text-[#c6ad88] uppercase hover:text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Joining…" : buttonLabel}</button>
    </div>
    <label className="mt-4 flex items-start gap-2.5 text-[11px] leading-5 text-white/60"><input className="mt-1 accent-[#967c55]" disabled={pending} name="consent" required type="checkbox" /><span>I agree to receive N7 fragrance updates and offers by email. I can unsubscribe at any time. <Link className="underline underline-offset-2" href="/privacy">Privacy policy</Link></span></label>
    <div aria-hidden="true" className="hidden"><label>Website<input autoComplete="off" name="website" tabIndex={-1} /></label></div>
    <p aria-live="polite" className={`mt-3 text-xs leading-6 ${state.status === "error" ? "text-red-300" : "text-[#c6ad88]"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
  </form>;
}
