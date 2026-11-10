"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BlogEditConflictError, blogEditorRoles, deleteAdminBlogPost, saveAdminBlogPost } from "@/lib/admin/blogs";
import { formString } from "@/lib/admin/form";
import { MediaUploadError } from "@/lib/admin/media";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { BlogPostNotFoundError } from "@/lib/blogs/posts";
import { BlogPostValidationError } from "@/lib/blogs/validation";

export interface BlogActionState {
  error?: string;
  fieldErrors?: BlogPostValidationError["fieldErrors"];
}

function refreshStorefrontBlog(slug: string) {
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function saveBlogPostAction(
  id: string | null,
  _previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  const administrator = await requireAdministrator(blogEditorRoles);
  const intent = formString(formData, "intent");
  if (intent !== "save" && intent !== "publish" && intent !== "draft") {
    return { error: "Choose a valid publishing action and try again." };
  }

  const { ipAddress } = await getRequestMetadata();
  let saved: Awaited<ReturnType<typeof saveAdminBlogPost>>;
  try {
    saved = await saveAdminBlogPost(id, intent, formData, { administratorId: administrator.id, ipAddress });
  } catch (error) {
    if (error instanceof BlogPostValidationError) {
      return { error: error.message, fieldErrors: error.fieldErrors };
    }
    if (error instanceof MediaUploadError) {
      return { error: "Check the cover image and try again.", fieldErrors: { coverImageUrl: [error.message] } };
    }
    if (error instanceof BlogEditConflictError || error instanceof BlogPostNotFoundError) {
      return { error: error.message };
    }
    console.error("Unable to save blog post", error);
    return { error: "The post could not be saved. Please try again." };
  }

  revalidatePath("/admin/blogs");
  revalidatePath(`/admin/blogs/${saved.id}`);
  refreshStorefrontBlog(saved.slug);
  redirect(`/admin/blogs/${saved.id}?toast=${saved.feedback}`);
}

export async function deleteBlogPostAction(id: string): Promise<string | undefined> {
  const administrator = await requireAdministrator(blogEditorRoles);
  const { ipAddress } = await getRequestMetadata();
  let slug: string | undefined;
  try {
    slug = await deleteAdminBlogPost(id, { administratorId: administrator.id, ipAddress });
  } catch (error) {
    if (error instanceof BlogPostNotFoundError) return error.message;
    console.error("Unable to delete blog post", error);
    return "The post could not be deleted. Please try again.";
  }
  revalidatePath("/admin/blogs");
  revalidatePath(`/admin/blogs/${id}`);
  if (slug) refreshStorefrontBlog(slug);
}
