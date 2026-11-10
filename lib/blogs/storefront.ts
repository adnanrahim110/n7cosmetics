import type { RowDataPacket } from "mysql2/promise";
import { cache } from "react";
import { selectOne, selectRows } from "../db/query";
import { BLOG_SLUG_MAX_LENGTH, blogSlugPattern } from "./slug";

export interface PublishedBlogSummary extends RowDataPacket {
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  first_published_at: Date;
}

export interface PublishedBlogPost extends PublishedBlogSummary {
  body_html: string;
  updated_at: Date;
}

interface PublishedBlogRoute extends RowDataPacket {
  slug: string;
  updated_at: Date;
}

const summaryColumns = "slug, title, excerpt, cover_image_url, cover_image_alt, first_published_at";

export function listPublishedBlogPosts() {
  return selectRows<PublishedBlogSummary>(
    `SELECT ${summaryColumns} FROM blog_posts
     WHERE status = 'PUBLISHED'
     ORDER BY first_published_at DESC, id DESC`,
  );
}

export function listRelatedBlogPosts(slug: string) {
  return selectRows<PublishedBlogSummary>(
    `SELECT ${summaryColumns} FROM blog_posts
     WHERE status = 'PUBLISHED' AND slug <> ?
     ORDER BY first_published_at DESC, id DESC
     LIMIT 6`,
    [slug],
  );
}

export const getPublishedBlogPost = cache(async (slug: string) => {
  if (slug.length > BLOG_SLUG_MAX_LENGTH || !blogSlugPattern.test(slug)) return null;

  return selectOne<PublishedBlogPost>(
    `SELECT ${summaryColumns}, body_html, updated_at FROM blog_posts
     WHERE status = 'PUBLISHED' AND slug = ?`,
    [slug],
  );
});

export function listPublishedBlogRoutes() {
  return selectRows<PublishedBlogRoute>(
    "SELECT slug, updated_at FROM blog_posts WHERE status = 'PUBLISHED'",
  );
}
