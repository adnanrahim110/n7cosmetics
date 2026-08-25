"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  submitContactAction,
  type ContactFormState,
} from "@/app/(storefront)/contact/actions";
import { contactTopics } from "@/content/contact";

const initialState: ContactFormState = { status: "idle", message: "" };
const fieldClass =
  "mt-2 w-full border border-black/15 bg-white/55 px-4 py-3.5 text-sm text-[#1c1814] outline-none transition placeholder:text-black/30 focus:border-[#967C55] focus:bg-white focus:ring-2 focus:ring-[#967C55]/12 disabled:cursor-not-allowed disabled:opacity-55";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="mt-1.5 text-xs text-red-700" id={id}>
      {message}
    </p>
  ) : null;
}

export default function ContactForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    submitContactAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const disabled = pending || !enabled;

  return (
    <form action={formAction} className="space-y-6" ref={formRef}>
      <div
        aria-live="polite"
        className={
          state.status === "idle"
            ? "sr-only"
            : `flex items-start gap-3 border px-4 py-3.5 text-sm leading-6 ${
                state.status === "success"
                  ? "border-emerald-700/25 bg-emerald-50 text-emerald-900"
                  : "border-red-700/20 bg-red-50 text-red-800"
              }`
        }
        role={state.status === "error" ? "alert" : "status"}
      >
        {state.status === "success" ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
        ) : null}
        <span>{state.message}</span>
      </div>

      {!enabled ? (
        <div className="border border-amber-800/20 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-950">
          Online messages are temporarily unavailable because a contact email
          has not been configured.
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">
          Name
          <input
            aria-describedby={state.fieldErrors?.name ? "contact-name-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            autoComplete="name"
            className={fieldClass}
            disabled={disabled}
            maxLength={120}
            name="name"
            placeholder="Your name"
            required
          />
          <FieldError id="contact-name-error" message={state.fieldErrors?.name} />
        </label>

        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">
          Email
          <input
            aria-describedby={state.fieldErrors?.email ? "contact-email-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            autoComplete="email"
            className={fieldClass}
            disabled={disabled}
            maxLength={190}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <FieldError id="contact-email-error" message={state.fieldErrors?.email} />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">
          Phone <span className="font-normal tracking-normal text-black/32">(optional)</span>
          <input
            aria-describedby={state.fieldErrors?.phone ? "contact-phone-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            autoComplete="tel"
            className={fieldClass}
            disabled={disabled}
            maxLength={50}
            name="phone"
            placeholder="Your phone number"
            type="tel"
          />
          <FieldError id="contact-phone-error" message={state.fieldErrors?.phone} />
        </label>

        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">
          How can we help?
          <select
            aria-describedby={state.fieldErrors?.topic ? "contact-topic-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.topic)}
            className={`${fieldClass} appearance-none`}
            defaultValue=""
            disabled={disabled}
            name="topic"
            required
          >
            <option disabled value="">
              Select a topic
            </option>
            {contactTopics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          <FieldError id="contact-topic-error" message={state.fieldErrors?.topic} />
        </label>
      </div>

      <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/58">
        Message
        <textarea
          aria-describedby={state.fieldErrors?.message ? "contact-message-error" : "contact-message-hint"}
          aria-invalid={Boolean(state.fieldErrors?.message)}
          className={`${fieldClass} min-h-44 resize-y leading-7`}
          disabled={disabled}
          maxLength={5000}
          minLength={20}
          name="message"
          placeholder="Tell us how we can help…"
          required
          rows={6}
        />
        <span className="mt-1.5 block text-[11px] font-normal normal-case tracking-normal text-black/35" id="contact-message-hint">
          Please include an order number when your question concerns an existing order.
        </span>
        <FieldError id="contact-message-error" message={state.fieldErrors?.message} />
      </label>

      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        <label>
          Company website
          <input autoComplete="off" name="companyWebsite" tabIndex={-1} />
        </label>
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-black/55">
          <input
            aria-describedby={state.fieldErrors?.consent ? "contact-consent-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.consent)}
            className="mt-1 size-4 shrink-0 accent-[#8d6745]"
            disabled={disabled}
            name="consent"
            required
            type="checkbox"
          />
          <span>
            I understand that my details will be used to respond to this enquiry
            as described in the{" "}
            <Link className="text-[#7a5825] underline underline-offset-4" href="/privacy">
              privacy policy
            </Link>
            .
          </span>
        </label>
        <FieldError id="contact-consent-error" message={state.fieldErrors?.consent} />
      </div>

      <button
        className="group inline-flex min-h-13 items-center justify-center gap-3 bg-[#1c1814] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#8d6745] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled}
        type="submit"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Send aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
        )}
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
