"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { archiveProductAction, deleteProductAction } from "@/app/admin/(dashboard)/products/actions";
import AdminConfirmationDialog from "./AdminConfirmationDialog";
import { showAdminToast } from "./AdminToastProvider";

export default function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [softDelete, setSoftDelete] = useState(false);

  return (
    <>
      <button aria-label={`Delete ${name}`} aria-haspopup="dialog" className="cursor-pointer rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => { setSoftDelete(false); setOpen(true); }} ref={trigger} title="Delete product" type="button"><Trash2 aria-hidden="true" size={16} /></button>
      {open ? <AdminConfirmationDialog
        title={softDelete ? "Soft delete product?" : "Delete product?"}
        description={softDelete
          ? `Soft delete “${name}”? It will be hidden from the storefront and kept in admin as Archived. Order history, pending checkouts, and bundle links will be preserved. Bundles containing it will be unavailable until it is restored or replaced. You can restore it by editing its status.`
          : `Permanently delete “${name}” and its catalog details, variants, and reviews? This cannot be undone. Existing order history will be kept.`}
        confirmLabel={softDelete ? "Soft delete product" : "Delete product"}
        pendingLabel={softDelete ? "Archiving…" : "Deleting…"}
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
        onConfirm={async () => {
          if (softDelete) {
            await archiveProductAction(productId);
            showAdminToast({ id: `product-archived:${productId}`, type: "success", title: "Product soft deleted", description: `“${name}” is hidden from the storefront and kept in admin as Archived.` });
            return;
          }
          const result = await deleteProductAction(productId);
          if (!result.success) {
            if (result.canSoftDelete) setSoftDelete(true);
            return result.message;
          }
          showAdminToast({ id: `product-deleted:${productId}`, type: "success", title: "Product deleted", description: `“${name}” has been deleted.` });
        }}
      /> : null}
    </>
  );
}
