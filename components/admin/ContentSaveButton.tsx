"use client";

import { useFormStatus } from "react-dom";

export default function ContentSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      aria-disabled={pending}
      className="min-h-11 rounded-md bg-zinc-950 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 active:bg-zinc-700 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving changes…" : "Save changes"}
    </button>
  );
}
