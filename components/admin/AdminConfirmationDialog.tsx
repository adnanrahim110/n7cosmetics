"use client";

import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface AdminConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  onConfirm: () => string | void | Promise<string | void>;
  onClose: () => void;
}

export default function AdminConfirmationDialog({ title, description, confirmLabel, pendingLabel = "Saving…", onConfirm, onClose }: AdminConfirmationDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const saving = useRef(false);
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    if (saving.current) return;
    dialog.current?.close();
    onClose();
  }

  async function confirm() {
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      const message = await onConfirm();
      if (message) {
        setError(message);
      } else {
        dialog.current?.close();
        onClose();
      }
    } catch {
      setError("The action could not be completed. Please try again.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={pending}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-0 text-left text-zinc-950 shadow-2xl backdrop:bg-zinc-950/45 backdrop:backdrop-blur-[3px]"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}
      ref={dialog}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600"><TriangleAlert aria-hidden="true" size={22} /></span>
          <button aria-label="Close confirmation" className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending} onClick={close} type="button"><X aria-hidden="true" size={18} /></button>
        </div>
        <h2 className="mt-4 text-lg font-semibold" id={`${id}-title`}>{title}</h2>
        <p className="mt-2 break-words text-sm leading-6 text-zinc-600" id={`${id}-description`}>{description}</p>
        {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 bg-zinc-50 px-5 py-4 sm:px-6">
        <button className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending} onClick={close} ref={cancel} type="button">Cancel</button>
        <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending} onClick={confirm} type="button">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
