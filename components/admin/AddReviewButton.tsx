"use client";

import { LoaderCircle, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createReviewAction } from "@/app/admin/(dashboard)/reviews/actions";
import { showAdminToast } from "@/components/admin/AdminToastProvider";
import CustomSelect from "@/components/admin/CustomSelect";
import type { AdminReviewField, CreateReviewResult } from "@/lib/admin/reviews-validation";

interface ProductOption { value: string; label: string }
type ReviewError = Extract<CreateReviewResult, { success: false }>;

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:bg-zinc-50";
const secondaryButtonClass = "cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50";

function Field({ id, label, error, children }: { id: string; label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600" htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-700" id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}

function AddReviewDialog({ products, close }: { products: ProductOption[]; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const saving = useRef(false);
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ReviewError | null>(null);
  const [defaultDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (error) errorMessage.current?.focus();
  }, [error]);

  function dismiss() {
    if (saving.current) return;
    dialog.current?.close();
    close();
  }

  function fieldProps(field: AdminReviewField) {
    return {
      id: `${titleId}-${field}`,
      name: field,
      "aria-invalid": Boolean(error?.fieldErrors?.[field]),
      "aria-describedby": error?.fieldErrors?.[field] ? `${titleId}-${field}-error` : undefined,
    };
  }

  function field(field: AdminReviewField, label: ReactNode, children: ReactNode) {
    return <Field id={`${titleId}-${field}`} label={label} error={error?.fieldErrors?.[field]?.[0]}>{children}</Field>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const formData = new FormData(event.currentTarget);
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await createReviewAction(formData);
      if (!result.success) {
        setError(result);
        return;
      }
      showAdminToast({ id: "review-created", type: "success", title: "Review added", description: "The review was published with the selected date." });
      dialog.current?.close();
      close();
    } catch {
      setError({ success: false, message: "The review could not be saved. Please try again." });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-description`}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/45 backdrop:backdrop-blur-[3px]"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
      }}
      ref={dialog}
    >
      <form aria-busy={pending} className="flex max-h-[calc(100dvh-2rem)] flex-col" onSubmit={submit}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-7">
          <div>
            <h2 className="font-body text-lg font-semibold" id={titleId}>Add review</h2>
            <p className="mt-1 text-xs text-zinc-500" id={`${titleId}-description`}>Manually add and publish a product review with your chosen date.</p>
          </div>
          <button aria-label="Close add review" className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-50" disabled={pending} onClick={dismiss} type="button"><X aria-hidden="true" size={18} /></button>
        </header>

        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          <fieldset className="min-w-0 space-y-4" disabled={pending}>
            {field("productId", "Product", <CustomSelect {...fieldProps("productId")} className="mt-1.5" disabled={pending} options={products} placeholder="Select a product" required />)}
            {!products.length ? <p className="text-xs text-amber-800">Add a product before creating a review.</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Reviewer name", <input {...fieldProps("name")} autoComplete="off" className={inputClass} maxLength={120} minLength={2} required />)}
              {field("email", <>Reviewer email <span className="font-normal text-zinc-400">(optional)</span></>, <input {...fieldProps("email")} autoComplete="off" className={inputClass} maxLength={190} type="email" />)}
              {field("rating", "Rating", <CustomSelect {...fieldProps("rating")} className="mt-1.5" disabled={pending} options={[5, 4, 3, 2, 1].map((rating) => ({ value: String(rating), label: `${rating} ${rating === 1 ? "star" : "stars"}` }))} placeholder="Select a rating" required searchable={false} />)}
              {field("reviewDate", "Review date", <input {...fieldProps("reviewDate")} className={inputClass} defaultValue={defaultDate} max="9999-12-31" min="1000-01-01" required type="date" />)}
            </div>
            <p className="text-xs text-zinc-500">Past dates are supported. The selected date will appear on the review.</p>
            {field("title", <>Review title <span className="font-normal text-zinc-400">(optional)</span></>, <input {...fieldProps("title")} className={inputClass} maxLength={120} />)}
            {field("body", "Review", <textarea {...fieldProps("body")} className={`${inputClass} resize-y`} maxLength={3000} minLength={20} placeholder="Enter the review (at least 20 characters)" required rows={4} />)}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600"><input className="size-4 accent-amber-700" defaultChecked name="recommendsProduct" type="checkbox" />Recommends this product</label>
          </fieldset>
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 sm:px-7">
          {error ? <p className="mb-3 text-sm text-red-700 outline-none" ref={errorMessage} role="alert" tabIndex={-1}>{error.message}</p> : null}
          <div className="flex items-center justify-end gap-2">
            <button className={secondaryButtonClass} disabled={pending} onClick={dismiss} type="button">Cancel</button>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending || !products.length} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" size={16} /> : <Plus aria-hidden="true" size={16} />}{pending ? "Saving…" : "Publish review"}</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

export default function AddReviewButton({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button aria-haspopup="dialog" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600" onClick={() => setOpen(true)} ref={trigger} type="button"><Plus aria-hidden="true" size={16} />Add Review</button>
      {open ? <AddReviewDialog products={products} close={() => { setOpen(false); trigger.current?.focus(); }} /> : null}
    </>
  );
}
