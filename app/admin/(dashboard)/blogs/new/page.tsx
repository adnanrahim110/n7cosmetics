import BlogEditorPage from "@/components/admin/blogs/BlogEditorPage";
import { blogEditorRoles } from "@/lib/admin/blogs";
import { requireAdministrator } from "@/lib/auth/session";

export default async function NewBlogAdminPage() {
  await requireAdministrator(blogEditorRoles);
  return <BlogEditorPage />;
}
