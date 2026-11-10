"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type SubmitEventHandler } from "react";
import type { BlogActionState } from "@/app/admin/(dashboard)/blogs/actions";
import { cn } from "@/lib/cn";
import StatusBadge from "../StatusBadge";
import BlogCoverFields from "./BlogCoverFields";
import BlogPostDetails from "./BlogPostDetails";

export interface BlogPostFormValues {
  title: string;
  slug: string;
  slugLocked: boolean;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  status: "DRAFT" | "PUBLISHED";
  revision: string;
}

interface BlogPostFormProps {
  action: (state: BlogActionState, formData: FormData) => Promise<BlogActionState>;
  apiKey?: string;
  post?: BlogPostFormValues;
}

const fields = ["title", "slug", "excerpt", "bodyHtml", "coverImageUrl", "coverImageAlt"] as const;
const buttonClass = "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = "bg-zinc-950 text-white hover:bg-zinc-800";
const secondaryClass = "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50";

export default function BlogPostForm({ action, apiKey, post }: BlogPostFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [editorReady, setEditorReady] = useState(false);
  const body = useRef(post?.bodyHtml ?? "");
  const submitting = useRef(false);
  const errorSummary = useRef<HTMLDivElement>(null);
  const published = post?.status === "PUBLISHED";

  useEffect(() => {
    submitting.current = false;
    if (state.error) errorSummary.current?.focus();
  }, [state]);

  const submit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (submitting.current || pending) return;

    // Submit without resetting the browser's file input when validation returns an error.
    const data = new FormData(event.currentTarget, event.nativeEvent.submitter);
    if (!data.has("intent")) data.set("intent", "save");
    data.set("bodyHtml", body.current);
    submitting.current = true;
    startTransition(() => formAction(data));
  };

  return (
    <form action={formAction} aria-busy={pending} className="mt-6 space-y-4 pb-8" onSubmit={submit}>
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" ref={errorSummary} role="alert" tabIndex={-1}>
          <p className="font-semibold">{state.error}</p>
          {state.fieldErrors ? (
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {fields.map((field) => {
                const error = state.fieldErrors?.[field]?.[0];
                return error ? <li key={field}><a className="underline" href={`#blog-${field}`}>{error}</a></li> : null;
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
      {post ? <input name="revision" type="hidden" value={post.revision} /> : null}
      <input defaultValue={post?.bodyHtml ?? ""} name="bodyHtml" type="hidden" />

      <fieldset className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-6" disabled={pending}>
        <legend className="sr-only">Blog post</legend>
        <BlogPostDetails
          apiKey={apiKey}
          fieldErrors={state.fieldErrors}
          onBodyChange={(html) => { body.current = html; }}
          onEditorReadyChange={setEditorReady}
          pending={pending}
          post={post}
        />
        <BlogCoverFields fieldErrors={state.fieldErrors} post={post} />
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={post?.status ?? "DRAFT"} />
            {pending ? <span className="text-sm text-zinc-600" role="status">Saving…</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={cn(buttonClass, published ? primaryClass : secondaryClass)} name="intent" type="submit" value="save">
              {published ? "Save changes" : "Save draft"}
            </button>
            {published ? (
              <button className={cn(buttonClass, secondaryClass)} name="intent" type="submit" value="draft">Move to draft</button>
            ) : (
              <button className={cn(buttonClass, primaryClass)} disabled={!editorReady} name="intent" type="submit" value="publish">Publish post</button>
            )}
          </div>
        </div>
      </fieldset>
    </form>
  );
}
