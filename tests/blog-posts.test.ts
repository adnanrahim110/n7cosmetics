import assert from "node:assert/strict";
import test from "node:test";
import type { PoolConnection } from "mysql2/promise";
import { addBlogArticleNavigation } from "../lib/blogs/article-navigation";
import { saveBlogPost } from "../lib/blogs/posts";
import { BlogPostValidationError, validateBlogPost } from "../lib/blogs/validation";

const coverImageUrl = "/media/ef6c810d-8687-40ad-9de7-78efefcc727d";
const duplicateSlug = Object.assign(new Error("Duplicate slug"), { code: "ER_DUP_ENTRY" });

test("article navigation links to nonempty headings with unique IDs and plain-text labels", () => {
  const { body, headings } = addBlogArticleNavigation("<h2>Scent &amp; <em>mood</em></h2><h3>Scent &amp; mood</h3><h2>&nbsp;</h2>");
  assert.deepEqual(headings, [
    { id: "blog-section-1", label: "Scent & mood", level: 2 },
    { id: "blog-section-2", label: "Scent & mood", level: 3 },
  ]);
  assert.equal(body, '<h2 id="blog-section-1">Scent &amp; <em>mood</em></h2><h3 id="blog-section-2">Scent &amp; mood</h3><h2>&nbsp;</h2>');
});

function databaseConnection(execute: (sql: string, values: unknown[]) => unknown): PoolConnection {
  return {
    execute: async (sql: string, values: unknown[]) => [execute(sql, values)],
  } as unknown as PoolConnection;
}

test("drafts need only a title, while publishing requires meaningful content and cover details", () => {
  const draft = validateBlogPost({ title: "  Choosing a fragrance  " });
  assert.equal(draft.title, "Choosing a fragrance");
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.slug, "");

  assert.throws(() => validateBlogPost({ title: "   " }), BlogPostValidationError);
  assert.throws(
    () => validateBlogPost({ title: draft.title, bodyHtml: "<p>&nbsp;&#8203;<br></p>", status: "PUBLISHED" }),
    (error) => {
      assert.ok(error instanceof BlogPostValidationError);
      assert.deepEqual(Object.keys(error.fieldErrors).sort(), ["bodyHtml", "coverImageAlt", "coverImageUrl", "excerpt"]);
      return true;
    },
  );
});

test("article HTML preserves editorial formatting and removes unsafe content", () => {
  const post = validateBlogPost({
    title: "Choosing a fragrance",
    status: "PUBLISHED",
    excerpt: "A short guide.",
    coverImageUrl,
    coverImageAlt: "Fragrance bottles on a tray",
    bodyHtml: '<h2>A guide</h2><p style="color:red" onclick="alert(1)"><strong>Read</strong> <a href="/n7">our range</a>.</p>'
      + '<a href="java&#x73;cript:alert(1)">Unsafe link</a><a href="//other.example">Relative origin</a>'
      + '<script>alert(1)</script><img src="https://other.example/image.png"><iframe src="https://other.example"></iframe>',
  });

  assert.equal(post.bodyHtml, '<h2>A guide</h2><p><strong>Read</strong> <a href="/n7">our range</a>.</p><a>Unsafe link</a><a>Relative origin</a>');
});

test("a generated slug retries a collision, while a custom slug reports a field error", async () => {
  const slugs: unknown[] = [];
  const connection = databaseConnection((sql, [slug]) => {
    assert.match(sql, /INSERT INTO blog_posts/);
    slugs.push(slug);
    if (slug === "cafe-oud") throw duplicateSlug;
    return { insertId: 42 };
  });

  assert.deepEqual(
    await saveBlogPost(connection, null, { title: "Café & Oud" }),
    { id: "42", slug: "cafe-oud-2" },
  );
  await assert.rejects(
    saveBlogPost(connection, null, { title: "Café & Oud", slug: "cafe-oud" }),
    (error) => error instanceof BlogPostValidationError && Boolean(error.fieldErrors.slug),
  );
  assert.deepEqual(slugs, ["cafe-oud", "cafe-oud-2", "cafe-oud"]);
});

test("a post keeps its slug after first publication even when saved as a draft", async () => {
  const savedSlugs: unknown[] = [];
  const connection = databaseConnection((sql, values) => {
    if (sql.includes("FOR UPDATE")) {
      assert.deepEqual(values, ["42"]);
      return [{ slug: "first-url", first_published_at: new Date("2026-10-01T12:00:00Z") }];
    }
    assert.match(sql, /UPDATE blog_posts/);
    savedSlugs.push(values[0]);
    return { affectedRows: 1 };
  });

  assert.deepEqual(
    await saveBlogPost(connection, "42", { title: "A revised title", slug: "", status: "DRAFT" }),
    { id: "42", slug: "first-url" },
  );
  await assert.rejects(
    saveBlogPost(connection, "42", { title: "A revised title", slug: "another-url", status: "DRAFT" }),
    (error) => error instanceof BlogPostValidationError && Boolean(error.fieldErrors.slug),
  );
  assert.deepEqual(savedSlugs, ["first-url"]);
});
