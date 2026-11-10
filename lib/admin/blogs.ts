import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { writeAuditLog } from "../auth/audit";
import type { AdministratorRole } from "../auth/types";
import { BlogPostNotFoundError, saveBlogPost } from "../blogs/posts";
import { BlogPostValidationError } from "../blogs/validation";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { formString, isDatabaseId, nullableFormString } from "./form";
import { cleanupUnreferencedMediaUrls, removeStoredMediaFiles, retainedMediaUrls, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "./media";

export const blogEditorRoles = ["OWNER", "MANAGER"] as const satisfies readonly AdministratorRole[];

interface AdminBlogSummary extends RowDataPacket {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  cover_image_url: string | null;
  first_published_at: Date | null;
  updated_at: Date;
}

interface AdminBlogPost extends AdminBlogSummary {
  excerpt: string;
  body_html: string;
  cover_image_alt: string;
}

interface BlogAuditContext {
  administratorId: string;
  ipAddress: string;
}

export type BlogSaveIntent = "save" | "publish" | "draft";

const summaryColumns = "CAST(id AS CHAR) AS id, title, slug, status, cover_image_url, first_published_at, updated_at";

export function listAdminBlogs() {
  return selectRows<AdminBlogSummary>(
    `SELECT ${summaryColumns} FROM blog_posts ORDER BY updated_at DESC, blog_posts.id DESC`,
  );
}

export function getAdminBlogPost(id: string, connection?: PoolConnection) {
  return selectOne<AdminBlogPost>(
    `SELECT ${summaryColumns}, excerpt, body_html, cover_image_alt
     FROM blog_posts WHERE id = ?${connection ? " FOR UPDATE" : ""}`,
    [id],
    connection,
  );
}

export class BlogEditConflictError extends Error {
  constructor() {
    super("This post changed since you opened it. Reopen the post before saving again.");
    this.name = "BlogEditConflictError";
  }
}

async function cleanupBlogCover(url: string | null) {
  if (!url) return;
  await cleanupUnreferencedMediaUrls([url]).catch((error) => {
    console.error("Unable to remove an unused blog cover", error);
  });
}

export async function saveAdminBlogPost(
  id: string | null,
  intent: BlogSaveIntent,
  formData: FormData,
  audit: BlogAuditContext,
) {
  if (id !== null && !isDatabaseId(id)) throw new BlogPostNotFoundError();

  const title = formString(formData, "title");
  const coverImageAlt = nullableFormString(formData, "coverImageAlt");
  let uploaded: StoredMediaAsset[] = [];

  const saved = await withTransaction(async (connection) => {
    const current = id === null ? null : await getAdminBlogPost(id, connection);
    if (id !== null && !current) throw new BlogPostNotFoundError();
    if (current && formString(formData, "revision") !== current.updated_at.toISOString()) {
      throw new BlogEditConflictError();
    }

    const previousCover = current?.cover_image_url ?? null;
    const retained = retainedMediaUrls(formData, "coverImageUrl");
    if (retained.some((url) => url !== previousCover)) {
      throw new BlogPostValidationError({ coverImageUrl: ["Select a cover image for this post."] });
    }

    uploaded = await storeMediaFiles(submittedMediaFiles(formData, "coverImageUrl"), {
      uploadedBy: audit.administratorId,
      connection,
      expectedType: "image",
      folder: "blogs/covers",
      altTexts: [coverImageAlt],
      maximumFiles: 1,
    });

    const coverImageUrl = uploaded[0]?.url ?? (retained.length ? previousCover : null);
    const status = intent === "publish" ? "PUBLISHED" : intent === "draft" ? "DRAFT" : current?.status ?? "DRAFT";
    const post = await saveBlogPost(connection, id, {
      title,
      slug: formString(formData, "slug"),
      excerpt: formString(formData, "excerpt"),
      bodyHtml: formString(formData, "bodyHtml"),
      coverImageUrl: coverImageUrl ?? "",
      coverImageAlt: coverImageAlt ?? "",
      status,
    });

    const published = status === "PUBLISHED" && current?.status !== "PUBLISHED";
    const unpublished = status === "DRAFT" && current?.status === "PUBLISHED";
    await writeAuditLog({
      ...audit,
      action: published ? "BLOG_PUBLISH" : unpublished ? "BLOG_UNPUBLISH" : current ? "BLOG_UPDATE" : "BLOG_CREATE",
      entityType: "blog_post",
      entityId: post.id,
      summary: `${published ? "Published" : unpublished ? "Unpublished" : current ? "Updated" : "Created"} blog post ${title}`,
      metadata: { slug: post.slug, status },
    }, connection);

    return {
      id: post.id,
      slug: post.slug,
      replacedCover: previousCover === coverImageUrl ? null : previousCover,
      feedback: published ? "blog-published" : unpublished ? "blog-unpublished" : status === "PUBLISHED" ? "blog-updated" : "blog-draft-saved",
    };
  }).catch(async (error: unknown) => {
    await removeStoredMediaFiles(uploaded);
    throw error;
  });

  await cleanupBlogCover(saved.replacedCover);
  return saved;
}

export async function deleteAdminBlogPost(id: string, audit: BlogAuditContext) {
  if (!isDatabaseId(id)) throw new BlogPostNotFoundError();

  const removed = await withTransaction(async (connection) => {
    const post = await getAdminBlogPost(id, connection);
    if (!post) return null;

    await executeMutation("DELETE FROM blog_posts WHERE id = ?", [id], connection);
    await writeAuditLog({
      ...audit,
      action: "BLOG_DELETE",
      entityType: "blog_post",
      entityId: id,
      summary: `Deleted blog post ${post.title}`,
      metadata: { slug: post.slug, status: post.status },
    }, connection);
    return { slug: post.slug, coverImageUrl: post.cover_image_url };
  });

  await cleanupBlogCover(removed?.coverImageUrl ?? null);
  return removed?.slug;
}
