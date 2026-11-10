import type { BlogActionState } from "@/app/admin/(dashboard)/blogs/actions";
import MediaDropzone from "../MediaDropzone";
import type { BlogPostFormValues } from "./BlogPostForm";
import BlogTextField from "./BlogTextField";

export default function BlogCoverFields({
  post,
  fieldErrors,
}: {
  post?: BlogPostFormValues;
  fieldErrors?: BlogActionState["fieldErrors"];
}) {
  const coverError = fieldErrors?.coverImageUrl?.[0];

  return (
    <section aria-labelledby="blog-cover-title" className="min-w-0 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-950" id="blog-cover-title">Cover</h2>
      <div aria-describedby={coverError ? "blog-coverImageUrl-error" : undefined} id="blog-coverImageUrl" tabIndex={-1}>
        <MediaDropzone
          accept="image"
          defaultAssets={post?.coverImageUrl ? [{ url: post.coverImageUrl, name: post.coverImageAlt || post.title, type: "image" }] : []}
          hint="One image, up to 10 MB. Required to publish."
          label="Cover image"
          maxFiles={1}
          name="coverImageUrl"
        />
        {coverError ? <p className="mt-2 text-sm text-red-700" id="blog-coverImageUrl-error">{coverError}</p> : null}
      </div>
      <BlogTextField
        defaultValue={post?.coverImageAlt}
        error={fieldErrors?.coverImageAlt?.[0]}
        hint="Describe what is visible in the image. Required to publish."
        label="Cover alt text"
        maxLength={255}
        name="coverImageAlt"
      />
    </section>
  );
}
