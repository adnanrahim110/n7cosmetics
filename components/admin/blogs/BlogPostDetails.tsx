import type { BlogActionState } from "@/app/admin/(dashboard)/blogs/actions";
import BlogBodyEditor from "./BlogBodyEditor";
import type { BlogPostFormValues } from "./BlogPostForm";
import BlogTextField from "./BlogTextField";

interface BlogPostDetailsProps {
  apiKey?: string;
  fieldErrors?: BlogActionState["fieldErrors"];
  pending: boolean;
  post?: BlogPostFormValues;
  onBodyChange: (html: string) => void;
  onEditorReadyChange: (ready: boolean) => void;
}

export default function BlogPostDetails({
  apiKey,
  fieldErrors,
  pending,
  post,
  onBodyChange,
  onEditorReadyChange,
}: BlogPostDetailsProps) {
  return (
    <section aria-labelledby="blog-details-title" className="min-w-0 space-y-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-950" id="blog-details-title">Post details</h2>
      <BlogTextField defaultValue={post?.title} error={fieldErrors?.title?.[0]} label="Title" maxLength={190} name="title" required />
      <BlogTextField
        defaultValue={post?.slug}
        error={fieldErrors?.slug?.[0]}
        hint={post?.slugLocked ? "The URL is fixed after first publication." : "Leave blank to generate the URL from the title."}
        label="Slug"
        maxLength={190}
        name="slug"
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        readOnly={post?.slugLocked}
      />
      <BlogTextField
        defaultValue={post?.excerpt}
        error={fieldErrors?.excerpt?.[0]}
        hint="A short summary for the blog listing. Required to publish."
        label="Excerpt"
        maxLength={300}
        name="excerpt"
        rows={3}
      />
      <BlogBodyEditor
        apiKey={apiKey}
        defaultValue={post?.bodyHtml ?? ""}
        disabled={pending}
        error={fieldErrors?.bodyHtml?.[0]}
        onChange={onBodyChange}
        onReadyChange={onEditorReadyChange}
      />
    </section>
  );
}
