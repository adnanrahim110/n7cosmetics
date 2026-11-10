import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { isDatabaseId, slugify } from "../admin/form";
import { executeMutation, selectOne } from "../db/query";
import { BLOG_SLUG_MAX_LENGTH } from "./slug";
import { BlogPostValidationError, validateBlogPost } from "./validation";

interface ExistingBlogPost extends RowDataPacket {
  slug: string;
  first_published_at: Date | null;
}

export class BlogPostNotFoundError extends Error {
  constructor() {
    super("This blog post could not be found.");
    this.name = "BlogPostNotFoundError";
  }
}

// Use the caller's transaction so the row lock covers the save and any media writes.
export async function saveBlogPost(
  connection: PoolConnection,
  postId: string | null,
  input: unknown,
): Promise<{ id: string; slug: string }> {
  const post = validateBlogPost(input);
  let existing: ExistingBlogPost | null = null;
  if (postId !== null) {
    if (!isDatabaseId(postId)) throw new BlogPostNotFoundError();
    existing = await selectOne<ExistingBlogPost>(
      "SELECT slug, first_published_at FROM blog_posts WHERE id = ? FOR UPDATE",
      [postId],
      connection,
    );
    if (!existing) throw new BlogPostNotFoundError();
  }

  const lockedSlug = existing?.first_published_at ? existing.slug : "";
  if (lockedSlug && post.slug && post.slug !== lockedSlug) {
    throw new BlogPostValidationError({ slug: ["The URL is fixed after first publication."] });
  }

  if (post.coverImageUrl) {
    const image = await selectOne(
      "SELECT id FROM media_assets WHERE public_url = ? AND mime_type LIKE 'image/%'",
      [post.coverImageUrl],
      connection,
    );
    if (!image) throw new BlogPostValidationError({ coverImageUrl: ["Choose a valid uploaded cover image."] });
  }

  const requestedSlug = lockedSlug || post.slug;
  const baseSlug = requestedSlug || slugify(post.title).replace(/-$/, "") || "post";
  const fields = [
    post.title, post.excerpt, post.bodyHtml, post.coverImageUrl || null, post.coverImageAlt, post.status, post.status,
  ];

  for (let sequence = 1; ; sequence++) {
    const suffix = sequence === 1 ? "" : `-${sequence}`;
    const slug = baseSlug.slice(0, BLOG_SLUG_MAX_LENGTH - suffix.length).replace(/-$/, "") + suffix;
    try {
      if (postId === null) {
        const result = await executeMutation(
          `INSERT INTO blog_posts (slug, title, excerpt, body_html, cover_image_url, cover_image_alt, status, first_published_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'PUBLISHED' THEN CURRENT_TIMESTAMP(3) END)`,
          [slug, ...fields],
          connection,
        );
        return { id: String(result.insertId), slug };
      }

      await executeMutation(
        `UPDATE blog_posts
         SET slug = ?, title = ?, excerpt = ?, body_html = ?, cover_image_url = ?, cover_image_alt = ?, status = ?,
             first_published_at = CASE WHEN ? = 'PUBLISHED' THEN COALESCE(first_published_at, CURRENT_TIMESTAMP(3)) ELSE first_published_at END
         WHERE id = ?`,
        [slug, ...fields, postId],
        connection,
      );
      return { id: postId, slug };
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ER_DUP_ENTRY") throw error;
      if (requestedSlug) {
        throw new BlogPostValidationError({ slug: ["This URL is already used by another blog post."] });
      }
    }
  }
}
