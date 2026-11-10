"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { deleteBlogPostAction } from "@/app/admin/(dashboard)/blogs/actions";
import AdminConfirmationDialog from "../AdminConfirmationDialog";
import { showAdminToast } from "../AdminToastProvider";

export default function DeleteBlogPostButton({ id, title }: { id: string; title: string }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`Delete ${title}`}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        onClick={() => setOpen(true)}
        ref={trigger}
        title="Delete post"
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} /> Delete
      </button>
      {open ? (
        <AdminConfirmationDialog
          title="Delete blog post?"
          description={`Permanently delete “${title}”?`}
          confirmLabel="Delete post"
          pendingLabel="Deleting…"
          onClose={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
          onConfirm={async () => {
            const error = await deleteBlogPostAction(id);
            if (error) return error;
            showAdminToast({ id: `blog-deleted:${id}`, type: "success", title: "Blog post deleted" });
          }}
        />
      ) : null}
    </>
  );
}
