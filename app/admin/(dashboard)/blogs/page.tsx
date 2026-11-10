import { Plus } from "lucide-react";
import Link from "next/link";
import BlogPostTable from "@/components/admin/blogs/BlogPostTable";
import PageHeader from "@/components/admin/PageHeader";
import { blogEditorRoles, listAdminBlogs } from "@/lib/admin/blogs";
import { requireAdministrator } from "@/lib/auth/session";

export default async function BlogsAdminPage() {
  await requireAdministrator(blogEditorRoles);
  const posts = await listAdminBlogs();

  return (
    <>
      <PageHeader
        actions={(
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            href="/admin/blogs/new"
          >
            <Plus aria-hidden="true" size={16} /> Add post
          </Link>
        )}
        description="Write articles, manage drafts, and control which posts are published."
        eyebrow="Marketing & content"
        title="Blogs"
      />
      <BlogPostTable posts={posts} />
    </>
  );
}
