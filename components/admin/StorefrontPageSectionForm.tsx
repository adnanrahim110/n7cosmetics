"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { showAdminToast } from "@/components/admin/AdminToastProvider";
import type { StorefrontPageFormAction, StorefrontPageFormState } from "@/lib/admin/storefront-page-form";

export default function StorefrontPageSectionForm({
  action,
  title,
  children,
}: {
  action: StorefrontPageFormAction;
  title: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<StorefrontPageFormState, FormData>(async (previousState, formData) => {
    try {
      return await action(previousState, formData);
    } catch {
      return { revision: previousState.revision, status: "error", message: "The section could not be saved. Your changes are still in the form; please try again." };
    }
  }, {});
  const submitting = useRef(false);
  const shown = useRef<StorefrontPageFormState | null>(null);

  useEffect(() => {
    if (pending) return;
    submitting.current = false;
    if (!state.status || shown.current === state) return;
    shown.current = state;
    showAdminToast({
      id: `storefront-page:${title}`,
      type: state.status,
      title: state.status === "success" ? `${title} saved` : `${title} wasn’t saved`,
      description: state.message,
    });
  }, [pending, state, title]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const formData = new FormData(event.currentTarget);
    submitting.current = true;
    // Dispatch directly so React does not reset uncontrolled fields on errors.
    startTransition(() => formAction(formData));
  }

  return (
    <form action={formAction} aria-busy={pending} className="border-t border-zinc-100 p-5" onSubmit={submit}>
      <fieldset className="min-w-0" disabled={pending} key={state.revision ?? "initial"}>
        <legend className="sr-only">{title}</legend>
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-4 border-t border-zinc-100 pt-4">
          <button className="min-h-11 rounded-lg bg-zinc-950 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none" disabled={pending} type="submit">
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
