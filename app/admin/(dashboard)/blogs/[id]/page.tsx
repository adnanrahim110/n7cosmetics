import { notFound } from "next/navigation";
import BlogEditorPage from "@/components/admin/blogs/BlogEditorPage";
import { blogEditorRoles, getAdminBlogPost } from "@/lib/admin/blogs";
import { isDatabaseId } from "@/lib/admin/form";
import { requireAdministrator } from "@/lib/auth/session";

export default async function EditBlogAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdministrator(blogEditorRoles);
  const { id } = await params;
  if (!isDatabaseId(id)) notFound();
  const post = await getAdminBlogPost(id);
  if (!post) notFound();
  return <BlogEditorPage post={post} />;
}
