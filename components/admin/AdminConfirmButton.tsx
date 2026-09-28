"use client";

import { useRef, useState, type ComponentProps } from "react";
import AdminConfirmationDialog from "./AdminConfirmationDialog";

interface AdminConfirmButtonProps extends Omit<ComponentProps<"button">, "onClick" | "type"> {
  confirmationTitle: string;
  confirmationDescription: string;
  confirmLabel: string;
}

export default function AdminConfirmButton({ confirmationTitle, confirmationDescription, confirmLabel, children, ...buttonProps }: AdminConfirmButtonProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button {...buttonProps} aria-haspopup="dialog" onClick={(event) => { event.preventDefault(); setOpen(true); }} ref={trigger} type="submit">{children}</button>
      {open ? <AdminConfirmationDialog
        title={confirmationTitle}
        description={confirmationDescription}
        confirmLabel={confirmLabel}
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
        onConfirm={() => { trigger.current?.form?.requestSubmit(trigger.current); }}
      /> : null}
    </>
  );
}
