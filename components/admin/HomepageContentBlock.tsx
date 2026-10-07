import type { ReactNode } from "react";
import ContentSaveButton from "./ContentSaveButton";

interface HomepageContentBlockProps {
  id: string;
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function HomepageContentBlock({ id, title, description, action, children, defaultOpen = false }: HomepageContentBlockProps) {
  return (
    <details
      className="group scroll-mt-20 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm open:border-zinc-300"
      id={id}
      open={defaultOpen}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-4 py-3 marker:content-none hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-700 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block font-body text-sm font-semibold text-zinc-950">{title}</span>
          <span className="mt-1 hidden truncate text-xs text-zinc-500 sm:block">{description}</span>
        </span>
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-zinc-200 text-sm text-zinc-500 transition-transform group-open:rotate-180 motion-reduce:transition-none">
          ⌄
        </span>
      </summary>
      <form action={action} className="border-t border-zinc-100 p-4">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
        <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
          <ContentSaveButton />
        </div>
      </form>
    </details>
  );
}
