"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { showAdminToast } from "@/components/admin/AdminToastProvider";
import type { AdminToastType } from "@/lib/admin/toast-feedback";

interface AdminMutationFormProps extends Omit<ComponentProps<"form">, "action" | "children"> {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  loadingMessage: string;
  successMessage: string;
  successDescription?: string;
  successType?: AdminToastType;
  errorMessage?: string;
}

export default function AdminMutationForm({ action, children, loadingMessage, successMessage, successDescription, successType = "success", errorMessage = "That change couldn’t be completed", ...formProps }: AdminMutationFormProps) {
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const loadingId = toast.loading(loadingMessage);
    try {
      await action(formData);
      toast.dismiss(loadingId);
      showAdminToast({ id: `mutation:${successMessage}`, type: successType, title: successMessage, description: successDescription });
    } catch {
      toast.dismiss(loadingId);
      showAdminToast({ id: `mutation-error:${errorMessage}`, type: "error", title: errorMessage, description: "Nothing was changed. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return <form {...formProps} action={submit} aria-busy={pending}><fieldset className="contents" disabled={pending}>{children}</fieldset></form>;
}
