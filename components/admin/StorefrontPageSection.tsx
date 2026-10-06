import type { ReactNode } from "react";
import type { StorefrontPageFormAction } from "@/lib/admin/storefront-page-form";
import StorefrontPageSectionForm from "./StorefrontPageSectionForm";

export default function StorefrontPageSection({
  id,
  icon,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  action: StorefrontPageFormAction;
  children: ReactNode;
}) {
  return (
    <details className="group scroll-mt-20 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm open:border-zinc-300" id={id} open>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-5 py-4 marker:content-none hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-700">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-950">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-500">{description}</span>
        </span>
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition group-open:rotate-180 motion-reduce:transition-none">⌄</span>
      </summary>
      <StorefrontPageSectionForm action={action} title={title}>{children}</StorefrontPageSectionForm>
    </details>
  );
}
