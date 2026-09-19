import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { newsletterTokenValid } from "@/lib/email/newsletter";
import { manageNewsletterAction } from "../actions";

export const metadata: Metadata = { title: "N7 fragrance updates", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function NewsletterPage({ params, searchParams }: { params: Promise<{ action: string }>; searchParams: Promise<{ token?: string; result?: string }> }) {
  const { action } = await params;
  if (action !== "confirm" && action !== "unsubscribe") notFound();
  const { token = "", result } = await searchParams;
  const success = result === "success";
  const invalid = result === "invalid" || (!success && !newsletterTokenValid(token));
  const title = invalid ? "This link is no longer available." : success ? action === "confirm" ? "You’re on the N7 list." : "You’ve left the N7 list." : action === "confirm" ? "Confirm your fragrance updates." : "Leave the N7 fragrance list?";
  const description = invalid ? "The link may have expired or already been used. You can request a fresh subscription email from the form at the foot of the page." : success ? action === "confirm" ? "Your address is confirmed. Look out for notes on new fragrances, collection releases and selected N7 offers." : "N7 fragrance updates have been turned off for this address. Emails about your orders and enquiries are unaffected." : action === "confirm" ? "Choose below to receive N7 fragrance updates and offers. You can unsubscribe from any of those emails." : "Choose below to stop N7 fragrance updates. Your order and customer care emails will continue.";
  return <section className="bg-[#f3eee5] px-5 pb-24 pt-44 text-[#1c1814]"><div className="mx-auto max-w-xl border border-[#967c55]/30 bg-[#f7f2e9] p-8 sm:p-12"><p className="text-[10px] uppercase tracking-[0.25em] text-[#8d6745]">N7 · Fragrance notes</p><h1 className="mt-5 font-heading text-4xl">{title}</h1><p className="mt-6 text-sm leading-7 text-[#51483d]">{description}</p>{!success && !invalid ? <form action={manageNewsletterAction} className="mt-8"><input name="action" type="hidden" value={action} /><input name="token" type="hidden" value={token} /><button className="bg-[#967c55] px-6 py-3 text-sm text-white" type="submit">{action === "confirm" ? "Confirm my subscription" : "Unsubscribe"}</button></form> : null}<Link className="mt-7 inline-block text-sm text-[#8d6745] underline underline-offset-4" href="/">Return to N7</Link></div></section>;
}
