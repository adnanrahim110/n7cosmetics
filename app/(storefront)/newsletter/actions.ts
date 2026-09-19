"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getRequestMetadata } from "@/lib/auth/request";
import { kickEmailQueue } from "@/lib/email/kick";
import { confirmNewsletter, subscribeNewsletter, unsubscribeNewsletter } from "@/lib/email/newsletter";

export interface NewsletterState { status: "idle" | "success" | "error"; message: string }

export async function subscribeNewsletterAction(previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  void previous;
  const accepted: NewsletterState = { status: "success", message: "Check your inbox for a confirmation link. If your address is already confirmed, you’re on the N7 list." };
  if (formData.get("website")) return accepted;
  const email = z.email().max(190).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success || formData.get("consent") !== "on") return { status: "error", message: "Enter your email and confirm that you would like N7 fragrance updates." };
  try {
    const metadata = await getRequestMetadata();
    const result = await subscribeNewsletter(email.data, metadata.ipAddress);
    if (result === "limited") return { status: "error", message: "Please wait 30 minutes before requesting another subscription email." };
    kickEmailQueue();
    return accepted;
  } catch (error) {
    console.error("Newsletter signup could not be saved", error);
    return { status: "error", message: "Your subscription could not be saved. Please try again shortly." };
  }
}

export async function manageNewsletterAction(formData: FormData): Promise<void> {
  const action = formData.get("action");
  const token = String(formData.get("token") ?? "");
  if (action !== "confirm" && action !== "unsubscribe") redirect("/newsletter/confirm?result=invalid");
  const success = action === "confirm" ? await confirmNewsletter(token) : await unsubscribeNewsletter(token);
  if (success && action === "confirm") kickEmailQueue();
  redirect(`/newsletter/${action}?result=${success ? "success" : "invalid"}`);
}
