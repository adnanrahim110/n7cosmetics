import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { saveBlogPostAction } from "@/app/admin/(dashboard)/blogs/actions";
import type { getAdminBlogPost } from "@/lib/admin/blogs";
import PageHeader from "../PageHeader";
import BlogPostForm from "./BlogPostForm";

export default function BlogEditorPage({ post }: { post?: NonNullable<Awaited<ReturnType<typeof getAdminBlogPost>>> }) {
  const revision = post?.updated_at.toISOString();

  return (
    <>
      <PageHeader
        actions={(
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            href="/admin/blogs"
          >
            <ArrowLeft aria-hidden="true" size={16} /> All posts
          </Link>
        )}
        description={post?.status === "PUBLISHED" ? "Saving changes updates the published post." : "Save a draft while you write, then publish when it’s ready."}
        eyebrow="Marketing & content"
        title={post ? "Edit post" : "Add post"}
      />
      <BlogPostForm
        action={saveBlogPostAction.bind(null, post?.id ?? null)}
        apiKey={process.env.TINYMCE_API_KEY?.trim()}
        key={revision ? `${post?.id}:${revision}` : "new"}
        post={post && revision ? {
          title: post.title,
          slug: post.slug,
          slugLocked: post.first_published_at !== null,
          excerpt: post.excerpt,
          bodyHtml: post.body_html,
          coverImageUrl: post.cover_image_url,
          coverImageAlt: post.cover_image_alt,
          status: post.status,
          revision,
        } : undefined}
      />
    </>
  );
}
